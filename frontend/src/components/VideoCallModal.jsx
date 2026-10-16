import React, { useEffect, useRef, useState } from "react";
import { useCallContext } from "../context/CallContext";
import {
  MdCallEnd,
  MdMic,
  MdMicOff,
  MdVideocam,
  MdVideocamOff,
  MdFullscreen,
  MdFullscreenExit,
} from "react-icons/md";
import dp from "../assets/dp.webp";

function VideoCallModal() {
  const {
    callState,
    callPartner,
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    callDuration,
    callStatusMessage,
    endCall,
    toggleMic,
    toggleCamera,
  } = useCallContext();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attach local media stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Attach remote media stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
      setIsFullscreen(false);
    }
  };

  if (callState === "idle" || !callPartner) {
    if (callStatusMessage) {
      return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-5 py-2.5 rounded-full shadow-2xl text-xs sm:text-sm font-semibold border border-white/10 animate-fadeIn backdrop-blur-md">
          {callStatusMessage}
        </div>
      );
    }
    return null;
  }

  // 🔹 CALLING SCREEN (Outgoing Call waiting for answer)
  if (callState === "calling") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fadeIn">
        <div className="flex flex-col items-center text-center max-w-sm w-full">
          
          {/* Pulsing Avatar */}
          <div className="relative my-8">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-cyan-400 shadow-2xl relative z-10 bg-slate-800">
              <img
                src={callPartner.image || dp}
                alt={callPartner.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping -z-0"></span>
            <span className="absolute -inset-3 rounded-full border-2 border-cyan-400/40 animate-pulse -z-0"></span>
          </div>

          <h2 className="text-white font-bold text-2xl truncate max-w-[280px]">
            {callPartner.name || callPartner.userName}
          </h2>
          <p className="text-cyan-400 text-sm font-medium mt-1 animate-pulse">
            Ringing...
          </p>

          {/* Self preview (small bottom corner if localStream ready) */}
          {localStream && (
            <div className="mt-6 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
          )}

          {/* Cancel button */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-red-500/40 cursor-pointer transition-all"
              title="Cancel Call"
            >
              <MdCallEnd className="w-8 h-8" />
            </button>
            <span className="text-xs text-slate-400 font-medium">Cancel</span>
          </div>

        </div>
      </div>
    );
  }

  // 🔹 CONNECTED CALL VIEWPORT
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden animate-fadeIn"
    >
      {/* REMOTE VIDEO (Main Full Viewport) */}
      <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-center p-6 animate-pulse">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-cyan-500/60 shadow-xl mb-4 bg-slate-800">
              <img
                src={callPartner.image || dp}
                alt={callPartner.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-white font-bold text-lg sm:text-xl">
              {callPartner.name || callPartner.userName}
            </h3>
            <span className="text-cyan-400 text-xs sm:text-sm mt-1">
              Connecting video stream...
            </span>
          </div>
        )}

        {/* LOCAL VIDEO (Floating Picture-in-Picture at top-right) */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-slate-950 z-20">
          {localStream && !isCameraOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs">
              <MdVideocamOff className="w-6 h-6 mb-1 text-red-400" />
              <span>Camera Off</span>
            </div>
          )}
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
            You {isMicMuted && "🔇"}
          </span>
        </div>

        {/* TOP FLOATING HEADER (Partner info & Timer) */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 shrink-0">
            <img
              src={callPartner.image || dp}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <h4 className="text-xs sm:text-sm font-bold truncate max-w-[140px] sm:max-w-[200px]">
              {callPartner.name || callPartner.userName}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{formatTime(callDuration)}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM CONTROLS DOCK (Frosted Glass Floating Bar) */}
        <div className="absolute bottom-6 sm:bottom-8 z-30 flex items-center gap-3 sm:gap-4 bg-slate-900/80 backdrop-blur-xl px-5 sm:px-6 py-3 rounded-full border border-white/15 shadow-2xl">
          
          {/* Mic Toggle */}
          <button
            type="button"
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMicMuted
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-white/15 hover:bg-white/25 text-white"
            }`}
            title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMicMuted ? <MdMicOff className="w-6 h-6" /> : <MdMic className="w-6 h-6" />}
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isCameraOff
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-white/15 hover:bg-white/25 text-white"
            }`}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? (
              <MdVideocamOff className="w-6 h-6" />
            ) : (
              <MdVideocam className="w-6 h-6" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer hidden sm:flex"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <MdFullscreenExit className="w-6 h-6" />
            ) : (
              <MdFullscreen className="w-6 h-6" />
            )}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={endCall}
            className="w-13 h-13 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition-all cursor-pointer"
            title="End Call"
          >
            <MdCallEnd className="w-7 h-7" />
          </button>

        </div>

      </div>
    </div>
  );
}

export default VideoCallModal;
