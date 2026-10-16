import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSocketContext } from "./SocketContext";
import {
  startRingtone,
  stopRingtone,
  playConnectedSound,
  playEndCallSound,
} from "../utils/sound";

const CallContext = createContext();

export const useCallContext = () => useContext(CallContext);

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const CallContextProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const { userData } = useSelector((store) => store.auth);

  // Call states: "idle" | "calling" (outgoing) | "incoming" | "connected"
  const [callState, setCallState] = useState("idle");
  const [callPartner, setCallPartner] = useState(null);
  const [callType, setCallType] = useState("video"); // "video" | "audio"
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatusMessage, setCallStatusMessage] = useState("");

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const callPartnerRef = useRef(null);
  const callStateRef = useRef("idle");
  const callTimeoutRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const queuedCandidatesRef = useRef([]);

  // Keep refs synchronized with state
  useEffect(() => {
    callPartnerRef.current = callPartner;
  }, [callPartner]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Clean up all media tracks and connection
  const cleanupMediaAndPeer = useCallback(() => {
    stopRingtone();

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    queuedCandidatesRef.current = [];
    setRemoteStream(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
  }, []);

  const resetCall = useCallback(
    (statusMessage = "") => {
      cleanupMediaAndPeer();
      setCallState("idle");
      setCallPartner(null);
      if (statusMessage) {
        setCallStatusMessage(statusMessage);
        setTimeout(() => setCallStatusMessage(""), 4000);
      }
    },
    [cleanupMediaAndPeer]
  );

  // Initialize RTCPeerConnection
  const createPeerConnection = useCallback(
    (targetUserId) => {
      if (pcRef.current) {
        pcRef.current.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc:signal", {
            targetId: targetUserId,
            signalData: {
              type: "candidate",
              candidate: event.candidate,
            },
          });
        }
      };

      // Handle Remote Stream
      pc.ontrack = (event) => {
        console.log("Remote track received:", event.streams);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Add local stream tracks to PC
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      return pc;
    },
    [socket]
  );

  // 🔹 01 & 05: Start Call (Caller)
  const startCall = useCallback(
    async (recipientUser, type = "video") => {
      if (!socket || !recipientUser?._id) return;

      try {
        setCallStatusMessage("");
        setCallPartner(recipientUser);
        setCallType(type);
        setCallState("calling");

        startRingtone();

        // 05: Request Camera & Microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === "video",
          audio: true,
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        // 02 & 03: Send Invitation through Socket.IO
        socket.emit("call:start", {
          recipientId: recipientUser._id,
          callType: type,
          callerName: userData?.name || userData?.userName,
          callerImage: userData?.image || "",
        });

        // 04: Timeout after 30 seconds if unanswered
        callTimeoutRef.current = setTimeout(() => {
          if (callStateRef.current === "calling") {
            socket.emit("call:reject", {
              callerId: recipientUser._id,
              reason: "timeout",
            });
            playEndCallSound();
            resetCall("Call unanswered (timed out)");
          }
        }, 30000);
      } catch (err) {
        console.error("Camera/Mic access error:", err);
        stopRingtone();
        resetCall("Could not access camera/microphone. Please allow permissions.");
      }
    },
    [socket, userData, resetCall]
  );

  // 🔹 04 & 05: Accept Call (Recipient)
  const acceptCall = useCallback(async () => {
    const partner = callPartnerRef.current;
    if (!socket || !partner?._id) return;

    stopRingtone();

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    try {
      // 05: Request Camera & Microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create Peer Connection
      createPeerConnection(partner._id);

      setCallState("connected");
      playConnectedSound();

      // Emit acceptance to caller
      socket.emit("call:accept", { callerId: partner._id });
    } catch (err) {
      console.error("Media permission error on accept:", err);
      socket.emit("call:reject", {
        callerId: partner._id,
        reason: "Permissions denied",
      });
      resetCall("Camera/Microphone permission denied.");
    }
  }, [socket, callType, createPeerConnection, resetCall]);

  // 🔹 04: Decline / Reject Call (Recipient)
  const rejectCall = useCallback(
    (reason = "declined") => {
      const partner = callPartnerRef.current;
      if (socket && partner?._id) {
        socket.emit("call:reject", {
          callerId: partner._id,
          reason,
        });
      }
      playEndCallSound();
      resetCall();
    },
    [socket, resetCall]
  );

  // 🔹 08: End Call (Either party)
  const endCall = useCallback(() => {
    const partner = callPartnerRef.current;
    if (socket && partner?._id) {
      socket.emit("call:end", { targetId: partner._id });
    }
    playEndCallSound();
    resetCall("Call ended");
  }, [socket, resetCall]);

  // Controls: Mute/Unmute Mic
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Controls: Toggle Camera On/Off
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  // Duration Timer for Connected Call
  useEffect(() => {
    if (callState === "connected") {
      setCallDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [callState]);

  // 🔹 Socket Listeners for WebRTC Signaling
  useEffect(() => {
    if (!socket) return;

    // 03: Incoming Call
    const handleIncomingCall = ({ callerId, callerName, callerImage, callType: incomingType }) => {
      if (callStateRef.current !== "idle") {
        // Already busy
        socket.emit("call:reject", { callerId, reason: "busy" });
        return;
      }

      setCallPartner({
        _id: callerId,
        name: callerName,
        userName: callerName,
        image: callerImage,
      });
      setCallType(incomingType || "video");
      setCallState("incoming");
      startRingtone();

      // Auto-timeout after 30 seconds
      callTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === "incoming") {
          playEndCallSound();
          resetCall("Missed call");
        }
      }, 30000);
    };

    // 06: Caller receives call:accepted -> Creates SDP Offer
    const handleCallAccepted = async ({ recipientId }) => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      stopRingtone();
      playConnectedSound();
      setCallState("connected");

      try {
        const pc = createPeerConnection(recipientId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc:signal", {
          targetId: recipientId,
          signalData: {
            type: "offer",
            sdp: offer,
          },
        });
      } catch (err) {
        console.error("Error creating WebRTC offer:", err);
      }
    };

    // Call Rejected
    const handleCallRejected = ({ reason }) => {
      playEndCallSound();
      const msg = reason === "busy" ? "User is busy on another call." : "Call declined.";
      resetCall(msg);
    };

    // Call Failed
    const handleCallFailed = ({ message }) => {
      playEndCallSound();
      resetCall(message || "Call could not be completed.");
    };

    // 08: Call Ended
    const handleCallEnded = ({ reason }) => {
      playEndCallSound();
      resetCall(reason ? `Call ended: ${reason}` : "Call ended by user");
    };

    // 06: WebRTC Signaling (SDP Offer / Answer / ICE Candidates)
    const handleWebRTCSignal = async ({ senderId, signalData }) => {
      try {
        let pc = pcRef.current;
        if (!pc && signalData.type === "offer") {
          pc = createPeerConnection(senderId);
        }

        if (!pc) return;

        if (signalData.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

          // Drain queued ICE candidates
          while (queuedCandidatesRef.current.length > 0) {
            const cand = queuedCandidatesRef.current.shift();
            await pc.addIceCandidate(cand);
          }

          // Create & send SDP Answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("webrtc:signal", {
            targetId: senderId,
            signalData: {
              type: "answer",
              sdp: answer,
            },
          });
        } else if (signalData.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

          // Drain queued ICE candidates
          while (queuedCandidatesRef.current.length > 0) {
            const cand = queuedCandidatesRef.current.shift();
            await pc.addIceCandidate(cand);
          }
        } else if (signalData.type === "candidate") {
          const candidate = new RTCIceCandidate(signalData.candidate);
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(candidate);
          } else {
            queuedCandidatesRef.current.push(candidate);
          }
        }
      } catch (err) {
        console.error("WebRTC signaling error:", err);
      }
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:rejected", handleCallRejected);
    socket.on("call:failed", handleCallFailed);
    socket.on("call:ended", handleCallEnded);
    socket.on("webrtc:signal", handleWebRTCSignal);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:failed", handleCallFailed);
      socket.off("call:ended", handleCallEnded);
      socket.off("webrtc:signal", handleWebRTCSignal);
    };
  }, [socket, createPeerConnection, resetCall]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callPartner,
        callType,
        localStream,
        remoteStream,
        isMicMuted,
        isCameraOff,
        callDuration,
        callStatusMessage,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
