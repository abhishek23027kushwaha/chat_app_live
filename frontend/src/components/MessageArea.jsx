import React, { useEffect, useRef, useState, useCallback } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import {
  IoInformationCircleOutline,
  IoVideocam,
  IoSearch,
  IoClose,
  IoChevronUp,
  IoChevronDown,
} from "react-icons/io5";
import { MdGroups, MdRecordVoiceOver, MdOutlineReply, MdOutlineEdit, MdClose } from "react-icons/md";
import dp from "../assets/dp.webp";
import { RiEmojiStickerLine, RiSendPlane2Fill } from "react-icons/ri";
import { FaImages, FaPlay, FaPause, FaStop, FaMicrophone, FaTrash } from "react-icons/fa6";
import EmojiPicker from "emoji-picker-react";
import SenderMessage from "./SenderMessage";
import ReceiverMessage from "./ReceiverMessage";
import ForwardModal from "./ForwardModal";
import ImagePreviewModal from "./ImagePreviewModal";
import ImageViewerModal from "./ImageViewerModal";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, setSelectedUser, setSelectedGroup } from "@/redux/userSlice";
import axios from "axios";
import { server_url } from "@/utils/constant";
import { useSocketContext } from "@/context/SocketContext";
import { useCallContext } from "@/context/CallContext";
import GroupInfoModal from "./GroupInfoModal";
import MicPermissionModal from "./MicPermissionModal";
import { formatChatDateSeparator, isDifferentDay } from "@/utils/dateUtils";

function MessageArea() {
  const dispatch = useDispatch();
  const { selectedUser, selectedGroup, messages, userData } = useSelector((store) => store.auth);
  const { socket, onlineUsers } = useSocketContext();
  const { startCall } = useCallContext();

  const [showPicker, setShowPicker] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [groupTypingUser, setGroupTypingUser] = useState(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // 🔹 Image Sharing & Lightbox States
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [viewerImageData, setViewerImageData] = useState(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  // 🔹 Reply, Edit, Forward & Reaction States
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  // 🔹 In-Chat Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // 🔹 Speech-to-Text (Voice Typing) States
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState("hi-IN"); // "hi-IN" | "en-IN" | "en-US"
  const [showLangMenu, setShowLangMenu] = useState(false);
  const recognitionRef = useRef(null);

  // 🔹 Voice Recording (Audio Note) States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const previewAudioRef = useRef(null);

  const imageRef = useRef();
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);

  const isGroupChat = Boolean(selectedGroup);
  const activeChat = selectedUser || selectedGroup;

  const isOnline = Boolean(
    selectedUser?._id && onlineUsers?.some((id) => String(id) === String(selectedUser._id))
  );

  // 🔹 Fetch messages (Direct or Group)
  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`${server_url}/api/message/${selectedUser._id}`, { withCredentials: true });
          dispatch(setMessages(res.data));
          if (socket) {
            socket.emit("mark_read", { senderId: selectedUser._id });
          }
        } catch (error) {
          console.log(error);
        }
      };
      fetchMessages();
      setIsTyping(false);
    } else if (selectedGroup) {
      const fetchGroupMessages = async () => {
        try {
          const res = await axios.get(`${server_url}/api/group/messages/${selectedGroup._id}`, { withCredentials: true });
          dispatch(setMessages(res.data));
        } catch (error) {
          console.log(error);
        }
      };
      fetchGroupMessages();
      setGroupTypingUser(null);

      // Join group room on socket
      if (socket) {
        socket.emit("join_group", selectedGroup._id);
      }
    }
  }, [selectedUser?._id, selectedGroup?._id, dispatch, socket]);

  // 🔹 Real-time socket listeners for Direct Chat & Group Chat
  useEffect(() => {
    if (!socket) return;

    // 1-on-1 events
    const handleTyping = ({ senderId }) => {
      if (selectedUser?._id && String(selectedUser._id) === String(senderId)) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (selectedUser?._id && String(selectedUser._id) === String(senderId)) {
        setIsTyping(false);
      }
    };

    const handleNewMessage = (newMessage) => {
      const msgSenderId = newMessage.sender?._id || newMessage.sender;

      // 1. Acknowledge delivery to sender
      socket.emit("message_delivered", {
        messageId: newMessage._id,
        senderId: msgSenderId,
      });

      // 2. If chat with sender is currently open, mark read immediately
      if (selectedUser?._id && String(selectedUser._id) === String(msgSenderId)) {
        socket.emit("mark_read", { senderId: msgSenderId });
        dispatch(setMessages([...messages, { ...newMessage, status: "read" }]));
        setIsTyping(false);
      }
    };

    // 🔹 Single message delivered
    const handleMessageDelivered = ({ messageId }) => {
      if (!messageId) return;
      dispatch(
        setMessages(
          messages.map((m) =>
            String(m._id) === String(messageId) && m.status !== "read"
              ? { ...m, status: "delivered" }
              : m
          )
        )
      );
    };

    // 🔹 Bulk messages delivered (receiver connected)
    const handleMessagesDelivered = ({ messageIds }) => {
      if (!messageIds || messageIds.length === 0) return;
      const idSet = new Set(messageIds.map(String));
      dispatch(
        setMessages(
          messages.map((m) =>
            idSet.has(String(m._id)) && m.status !== "read"
              ? { ...m, status: "delivered" }
              : m
          )
        )
      );
    };

    // 🔹 Messages read (Blue double tick)
    const handleMessagesRead = ({ readerId }) => {
      if (!readerId) return;
      if (selectedUser?._id && String(selectedUser._id) === String(readerId)) {
        dispatch(
          setMessages(
            messages.map((m) => {
              const senderId = m.sender?._id || m.sender;
              if (String(senderId) === String(userData?._id)) {
                return { ...m, status: "read" };
              }
              return m;
            })
          )
        );
      }
    };

    // Group events
    const handleGroupTyping = ({ groupId, userName, senderId }) => {
      if (selectedGroup?._id && String(selectedGroup._id) === String(groupId)) {
        if (String(senderId) !== String(userData?._id)) {
          setGroupTypingUser(userName);
        }
      }
    };

    const handleGroupStopTyping = ({ groupId }) => {
      if (selectedGroup?._id && String(selectedGroup._id) === String(groupId)) {
        setGroupTypingUser(null);
      }
    };

    const handleNewGroupMessage = ({ groupId, message }) => {
      if (selectedGroup?._id && String(selectedGroup._id) === String(groupId)) {
        dispatch(setMessages([...messages, message]));
        setGroupTypingUser(null);
      }
    };

    // 🔹 Real-time edit listener
    const handleMessageEdited = ({ message }) => {
      if (!message) return;
      dispatch(
        setMessages(
          messages.map((m) => (String(m._id) === String(message._id) ? message : m))
        )
      );
    };

    // 🔹 Real-time delete listener
    const handleMessageDeleted = ({ messageId }) => {
      if (!messageId) return;
      dispatch(
        setMessages(
          messages.map((m) =>
            String(m._id) === String(messageId)
              ? {
                  ...m,
                  isDeleted: true,
                  message: "This message was deleted",
                  image: "",
                  audio: "",
                  reactions: [],
                }
              : m
          )
        )
      );
    };

    // 🔹 Real-time reaction listener
    const handleMessageReaction = ({ messageId, reactions }) => {
      if (!messageId) return;
      dispatch(
        setMessages(
          messages.map((m) =>
            String(m._id) === String(messageId)
              ? { ...m, reactions }
              : m
          )
        )
      );
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messagesDelivered", handleMessagesDelivered);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("group_typing", handleGroupTyping);
    socket.on("group_stop_typing", handleGroupStopTyping);
    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReaction", handleMessageReaction);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messagesDelivered", handleMessagesDelivered);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("group_typing", handleGroupTyping);
      socket.off("group_stop_typing", handleGroupStopTyping);
      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageReaction", handleMessageReaction);
    };
  }, [socket, selectedUser?._id, selectedGroup?._id, messages, userData?._id, dispatch]);

  // 🔹 Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, groupTypingUser]);

  // Clean up recording, search & state on unmount or chat switch
  useEffect(() => {
    setReplyingTo(null);
    setEditingMessage(null);
    setForwardingMessage(null);
    setIsForwardOpen(false);
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchMatches([]);
    setHighlightedMessageId(null);
    setIsImagePreviewOpen(false);
    setIsImageViewerOpen(false);
    setViewerImageData(null);
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
    };
  }, [selectedUser?._id, selectedGroup?._id]);

  // 🔹 1. Image Selection (JPG, PNG, WebP) & Validation
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setVoiceError("Please select a valid image (JPG, PNG, or WebP).");
      setTimeout(() => setVoiceError(""), 4000);
      e.target.value = null;
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setVoiceError("Image size must be less than 15MB.");
      setTimeout(() => setVoiceError(""), 4000);
      e.target.value = null;
      return;
    }

    setSelectedImageFile(file);
    const url = URL.createObjectURL(file);
    setSelectedImagePreviewUrl(url);
    setIsImagePreviewOpen(true);
    e.target.value = null;
  };

  const handleCloseImagePreview = () => {
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }
    setSelectedImageFile(null);
    setSelectedImagePreviewUrl(null);
    setIsImagePreviewOpen(false);
    setIsUploadingImage(false);
  };

  // 🔹 2. Send Image with optional caption & replyTo
  const handleSendImage = async (captionText = "") => {
    if (!selectedImageFile) return;

    try {
      setIsUploadingImage(true);
      setVoiceError("");

      const formData = new FormData();
      formData.append("image", selectedImageFile);
      if (captionText) {
        formData.append("message", captionText);
      }
      if (replyingTo) {
        formData.append("replyTo", replyingTo._id);
      }

      let res;
      if (isGroupChat) {
        res = await axios.post(
          `${server_url}/api/group/send/${selectedGroup._id}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        res = await axios.post(
          `${server_url}/api/message/send/${selectedUser._id}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      const alreadyInList = messages.some((m) => String(m._id) === String(res.data._id));
      if (!alreadyInList) {
        dispatch(setMessages([...messages, res.data]));
      }

      setReplyingTo(null);
      handleCloseImagePreview();
    } catch (err) {
      console.error("Image upload error:", err);
      setVoiceError("Failed to upload image. Please try again.");
      setTimeout(() => setVoiceError(""), 4000);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 🔹 3. Full-Screen Image Lightbox
  const handleOpenImageViewer = (imageUrl, messageObj) => {
    if (!imageUrl) return;
    const msgSenderId = messageObj?.sender?._id || messageObj?.sender;
    const isMine = String(msgSenderId) === String(userData?._id);
    const senderName = isGroupChat
      ? (messageObj?.sender?.name || messageObj?.sender?.userName || "Member")
      : isMine
      ? "You"
      : (selectedUser?.name || selectedUser?.userName || "User");

    setViewerImageData({
      url: imageUrl,
      caption: messageObj?.message || "",
      senderName,
      createdAt: messageObj?.createdAt,
    });
    setIsImageViewerOpen(true);
  };

  const handleCloseImageViewer = () => {
    setIsImageViewerOpen(false);
    setViewerImageData(null);
  };

  // 🔹 Handle typing input change with auto-debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (!socket) return;

    if (isGroupChat) {
      if (!selectedGroup?._id) return;

      if (value.trim().length > 0) {
        socket.emit("group_typing", {
          groupId: selectedGroup._id,
          userName: userData?.name || userData?.userName,
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("group_stop_typing", { groupId: selectedGroup._id });
        }, 1500);
      } else {
        socket.emit("group_stop_typing", { groupId: selectedGroup._id });
      }
    } else {
      if (!selectedUser?._id) return;

      if (value.trim().length > 0) {
        socket.emit("typing", { receiverId: selectedUser._id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("stop_typing", { receiverId: selectedUser._id });
        }, 1500);
      } else {
        socket.emit("stop_typing", { receiverId: selectedUser._id });
      }
    }
  };

  // ==========================================================
  // 🗣️ SPEECH-TO-TEXT (Voice Typing via Web Speech API)
  // ==========================================================
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      setTimeout(() => setVoiceError(""), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError("");
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        setInput((prev) => {
          const separator = prev && !prev.endsWith(" ") ? " " : "";
          return prev + separator + transcript;
        });
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        if (err.error === "not-allowed") {
          setShowPermissionModal(true);
          setVoiceError("Microphone permission denied for voice typing.");
          setTimeout(() => setVoiceError(""), 5000);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // ==========================================================
  // 🎙️ VOICE RECORDING (Audio Note via MediaRecorder)
  // ==========================================================
  const startRecording = async () => {
    try {
      setVoiceError("");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setShowPermissionModal(true);
        setVoiceError("Voice recording is not supported on this browser.");
        setTimeout(() => setVoiceError(""), 5000);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Safe cross-browser mimeType detection
      let options = {};
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options = { mimeType: "audio/webm;codecs=opus" };
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options = { mimeType: "audio/mp4" };
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          options = { mimeType: "audio/ogg" };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());

        const mime = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);

        setRecordedAudioBlob(blob);
        setRecordedAudioUrl(url);
        setIsRecording(false);
      };

      mediaRecorder.start(200); // 200ms slices
      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      setIsRecording(false);
      setShowPermissionModal(true);
      setVoiceError("Microphone permission denied. Please allow mic in browser address bar.");
      setTimeout(() => setVoiceError(""), 5000);
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current.stop();
    }
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setIsRecording(false);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordingDuration(0);
    setIsPlayingPreview(false);
  };

  const togglePreviewPlay = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      audio
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch((e) => console.log(e));
    }
  };

  // 🔹 Reply action
  const handleReply = (msg) => {
    setEditingMessage(null);
    setReplyingTo(msg);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // 🔹 Edit action
  const handleEdit = (msg) => {
    setReplyingTo(null);
    setEditingMessage(msg);
    setInput(msg.message || "");
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInput("");
  };

  // 🔹 Delete action
  const handleDelete = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message for everyone?")) return;
    try {
      await axios.delete(`${server_url}/api/message/delete/${messageId}`, {
        withCredentials: true,
      });
      dispatch(
        setMessages(
          messages.map((m) =>
            String(m._id) === String(messageId)
              ? {
                  ...m,
                  isDeleted: true,
                  message: "This message was deleted",
                  image: "",
                  audio: "",
                  reactions: [],
                }
              : m
          )
        )
      );
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };

  // 🔹 Reaction action
  const handleReact = async (messageId, emoji) => {
    try {
      const res = await axios.post(
        `${server_url}/api/message/react/${messageId}`,
        { emoji },
        { withCredentials: true }
      );
      dispatch(
        setMessages(
          messages.map((m) =>
            String(m._id) === String(messageId)
              ? { ...m, reactions: res.data }
              : m
          )
        )
      );
    } catch (err) {
      console.error("Reaction error:", err);
    }
  };

  // 🔹 Forward action
  const handleForward = (msg) => {
    setForwardingMessage(msg);
    setIsForwardOpen(true);
  };

  // 🔹 Jump / Scroll to Message with glowing highlight
  const handleScrollToMessage = (targetId) => {
    if (!targetId) return;
    const elem = document.getElementById(`msg-${targetId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(targetId);
      setTimeout(() => setHighlightedMessageId(null), 2500);
    }
  };

  // 🔹 In-chat Search Handlers
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      setHighlightedMessageId(null);
      return;
    }
    const q = val.toLowerCase().trim();
    const matches = (messages || []).filter(
      (m) => !m.isDeleted && m.message && m.message.toLowerCase().includes(q)
    );
    setSearchMatches(matches);
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
      handleScrollToMessage(matches[0]._id);
    } else {
      setCurrentMatchIndex(0);
      setHighlightedMessageId(null);
    }
  };

  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    handleScrollToMessage(searchMatches[nextIdx]._id);
  };

  const goToPrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    handleScrollToMessage(searchMatches[prevIdx]._id);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchMatches([]);
    setCurrentMatchIndex(0);
    setHighlightedMessageId(null);
  };

  // 🔹 SEND AUDIO MESSAGE
  const handleSendAudio = async () => {
    if (!recordedAudioBlob) return;

    try {
      setIsUploadingAudio(true);
      setVoiceError("");

      const formData = new FormData();
      formData.append("audio", recordedAudioBlob, "voice_message.webm");
      formData.append("audioDuration", String(recordingDuration || 1));
      if (replyingTo) {
        formData.append("replyTo", replyingTo._id);
      }

      let res;
      if (isGroupChat) {
        res = await axios.post(
          `${server_url}/api/group/send/${selectedGroup._id}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        res = await axios.post(
          `${server_url}/api/message/send/${selectedUser._id}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      const alreadyInList = messages.some((m) => String(m._id) === String(res.data._id));
      if (!alreadyInList) {
        dispatch(setMessages([...messages, res.data]));
      }

      setReplyingTo(null);
      cancelRecording();
    } catch (err) {
      console.error("Audio upload error:", err);
      setVoiceError("Failed to send voice note. Please try again.");
      setTimeout(() => setVoiceError(""), 4000);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // 🔹 SEND TEXT MESSAGE OR EDIT EXISTING
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket) {
      if (isGroupChat) {
        socket.emit("group_stop_typing", { groupId: selectedGroup._id });
      } else if (selectedUser?._id) {
        socket.emit("stop_typing", { receiverId: selectedUser._id });
      }
    }

    // 🔹 If currently EDITING a message
    if (editingMessage) {
      try {
        const res = await axios.put(
          `${server_url}/api/message/edit/${editingMessage._id}`,
          { newContent: input.trim() },
          { withCredentials: true }
        );
        dispatch(
          setMessages(
            messages.map((m) =>
              String(m._id) === String(editingMessage._id) ? res.data : m
            )
          )
        );
        setInput("");
        setEditingMessage(null);
      } catch (err) {
        console.error("Edit message error:", err);
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append("message", input.trim());
      if (replyingTo) {
        formData.append("replyTo", replyingTo._id);
      }

      if (isGroupChat) {
        const res = await axios.post(
          `${server_url}/api/group/send/${selectedGroup._id}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        const alreadyInList = messages.some((m) => String(m._id) === String(res.data._id));
        if (!alreadyInList) {
          dispatch(setMessages([...messages, res.data]));
        }
      } else {
        const res = await axios.post(
          `${server_url}/api/message/send/${selectedUser._id}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        dispatch(setMessages([...messages, res.data]));
      }

      setInput("");
      setReplyingTo(null);
    } catch (error) {
      console.log(error);
    }
  };

  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  const handleBack = () => {
    if (selectedUser) dispatch(setSelectedUser(null));
    if (selectedGroup) dispatch(setSelectedGroup(null));
  };

  const formatSeconds = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`w-full lg:flex-1 h-full bg-slate-200 relative overflow-hidden ${activeChat ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}>
      {activeChat ? (
        <div className="w-full h-full flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="w-full h-[65px] sm:h-[75px] bg-[#1797c2] shadow-md flex items-center justify-between px-3 sm:px-5 shrink-0 z-10">
            {isSearchOpen ? (
              /* 🔍 IN-CHAT SEARCH BAR */
              <div className="flex-1 flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-2xl px-3 py-1.5 text-white animate-fadeIn mr-2">
                <IoSearch className="w-5 h-5 text-white/80 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search messages in this chat..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-transparent outline-none text-white placeholder-white/70 text-sm sm:text-base"
                />
                {searchMatches.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0 text-xs text-white/90 font-medium">
                    <span className="px-1.5 py-0.5 bg-black/20 rounded-full text-[11px]">
                      {currentMatchIndex + 1}/{searchMatches.length}
                    </span>
                    <button
                      type="button"
                      onClick={goToPrevMatch}
                      className="p-1 hover:bg-white/20 rounded-full cursor-pointer transition-all"
                      title="Previous match"
                    >
                      <IoChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextMatch}
                      className="p-1 hover:bg-white/20 rounded-full cursor-pointer transition-all"
                      title="Next match"
                    >
                      <IoChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={closeSearch}
                  className="p-1 hover:bg-white/20 rounded-full cursor-pointer transition-all shrink-0"
                  title="Close search"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
            ) : (
              /* STANDARD CHAT HEADER (Avatar + Title + Status) */
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  type="button"
                  className="w-10 h-10 rounded-full hover:bg-white/10 active:scale-95 flex items-center justify-center cursor-pointer text-white transition-all shrink-0"
                  onClick={handleBack}
                  title="Back to chat list"
                >
                  <IoIosArrowRoundBack className="w-8 h-8 text-white" />
                </button>

                {/* Chat Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white shadow-sm border border-white/60 flex items-center justify-center">
                    {isGroupChat ? (
                      selectedGroup.profileImage ? (
                        <img src={selectedGroup.profileImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <MdGroups className="w-7 h-7 text-[#1797c2]" />
                      )
                    ) : (
                      <img src={selectedUser.image || dp} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  {!isGroupChat && isOnline && (
                    <span className="w-3 h-3 bg-emerald-400 border-2 border-white rounded-full absolute bottom-0 right-0 shadow-sm"></span>
                  )}
                </div>

                {/* Chat Title & Status */}
                <div className="flex flex-col min-w-0">
                  <h1 className="text-white font-semibold text-base sm:text-lg leading-tight truncate max-w-[150px] sm:max-w-[280px]">
                    {isGroupChat ? selectedGroup.name : (selectedUser.name || selectedUser.userName)}
                  </h1>
                  
                  {isGroupChat ? (
                    groupTypingUser ? (
                      <span className="text-xs text-white/95 font-medium italic animate-pulse">
                        {groupTypingUser} is typing...
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/80 truncate">
                        {selectedGroup.members?.length || 0} members
                      </span>
                    )
                  ) : (
                    isTyping ? (
                      <span className="text-xs text-white/95 font-medium italic flex items-center gap-1 animate-pulse">
                        typing...
                      </span>
                    ) : isOnline ? (
                      <span className="text-[11px] text-emerald-300 font-medium">Online</span>
                    ) : (
                      <span className="text-[11px] text-white/70">Offline</span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Header Right Actions */}
            <div className="flex items-center gap-1">
              {!isSearchOpen && (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="w-10 h-10 rounded-full hover:bg-white/20 active:scale-95 flex items-center justify-center cursor-pointer text-white transition-all shrink-0"
                  title="Search messages"
                >
                  <IoSearch className="w-5 h-5 text-white" />
                </button>
              )}

              {isGroupChat ? (
                <button
                  type="button"
                  onClick={() => setIsGroupInfoOpen(true)}
                  className="w-10 h-10 rounded-full hover:bg-white/20 active:scale-95 flex items-center justify-center cursor-pointer text-white transition-all shrink-0"
                  title="View Group Info"
                >
                  <IoInformationCircleOutline className="w-6 h-6 text-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startCall(selectedUser, "video")}
                  className="w-10 h-10 rounded-full hover:bg-white/20 active:scale-95 flex items-center justify-center cursor-pointer text-white transition-all shrink-0"
                  title="Start Video Call"
                >
                  <IoVideocam className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Voice Error Toast Alert */}
          {voiceError && (
            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-40 bg-red-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-xl animate-fadeIn">
              ⚠️ {voiceError}
            </div>
          )}

          {/* Messages Feed */}
          <div className="w-full flex-1 py-3 px-3 sm:px-6 overflow-y-auto flex flex-col gap-3">
            {showPicker && (
              <div className="absolute bottom-[80px] left-4 z-50 shadow-2xl rounded-2xl overflow-hidden animate-fadeIn">
                <EmojiPicker
                  width={300}
                  height={380}
                  onEmojiClick={onEmojiClick}
                />
              </div>
            )}

            {messages?.map((mess, index) => {
              const senderId = mess.sender?._id || mess.sender;
              const isMine = String(senderId) === String(userData?._id);
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDateSeparator =
                index === 0 ||
                isDifferentDay(prevMessage?.createdAt, mess?.createdAt);

              return (
                <React.Fragment key={mess._id || index}>
                  {/* 📅 Date Separator (Today, Yesterday, or Formatted Date) */}
                  {showDateSeparator && (
                    <div className="flex justify-center my-2.5 select-none">
                      <span className="bg-white/80 backdrop-blur-md text-gray-600 text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs border border-gray-200">
                        {formatChatDateSeparator(mess?.createdAt || new Date())}
                      </span>
                    </div>
                  )}

                  <div ref={index === messages.length - 1 ? scrollRef : null}>
                    {isMine ? (
                      <SenderMessage
                        messageObj={mess}
                        userImage={userData?.image}
                        onReply={handleReply}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onReact={handleReact}
                        onForward={handleForward}
                        onScrollToMessage={handleScrollToMessage}
                        onImageClick={handleOpenImageViewer}
                        currentUserId={userData?._id}
                        isHighlighted={highlightedMessageId === mess._id}
                      />
                    ) : (
                      <ReceiverMessage
                        messageObj={mess}
                        userImage={isGroupChat ? (mess.sender?.image || dp) : (selectedUser?.image || dp)}
                        senderName={isGroupChat ? (mess.sender?.name || mess.sender?.userName) : null}
                        onReply={handleReply}
                        onReact={handleReact}
                        onForward={handleForward}
                        onScrollToMessage={handleScrollToMessage}
                        onImageClick={handleOpenImageViewer}
                        currentUserId={userData?._id}
                        isHighlighted={highlightedMessageId === mess._id}
                      />
                    )}
                  </div>
                </React.Fragment>
              );
            })}

            {/* Floating Typing Indicator in chat */}
            {(isTyping || groupTypingUser) && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-2xl w-fit shadow-sm text-gray-600 text-xs self-start my-1 animate-fadeIn border border-gray-100">
                <span className="font-semibold text-[#1797c2]">
                  {isGroupChat
                    ? `${groupTypingUser} is typing`
                    : `${selectedUser.name || selectedUser.userName} is typing`}
                </span>
                <span className="flex gap-1 items-center ml-1">
                  <span className="w-1.5 h-1.5 bg-[#1797c2] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#1797c2] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#1797c2] rounded-full animate-bounce"></span>
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="w-full p-2.5 sm:p-4 bg-white/95 backdrop-blur-md border-t border-gray-300 shrink-0 flex flex-col items-center justify-center relative">
            
            {/* 💬 REPLY PREVIEW BANNER */}
            {replyingTo && (
              <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md border border-cyan-200 border-b-0 rounded-t-2xl p-2 sm:p-2.5 px-4 flex items-center justify-between shadow-sm animate-fadeIn -mb-1">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center text-[#1797c2] shrink-0">
                    <MdOutlineReply className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-xs min-w-0">
                    <span className="font-bold text-[#1797c2] truncate">
                      Replying to {replyingTo.sender?.name || replyingTo.sender?.userName || "message"}
                    </span>
                    <span className="text-gray-600 truncate text-[11px]">
                      {replyingTo.message || (replyingTo.audio ? "🎙️ Voice note" : "📷 Photo")}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelReply}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-all cursor-pointer"
                  title="Cancel reply"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* ✏️ EDIT MESSAGE BANNER */}
            {editingMessage && (
              <div className="w-full max-w-4xl bg-amber-50/95 backdrop-blur-md border border-amber-200 border-b-0 rounded-t-2xl p-2 sm:p-2.5 px-4 flex items-center justify-between shadow-sm animate-fadeIn -mb-1">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <MdOutlineEdit className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-xs min-w-0">
                    <span className="font-bold text-amber-700">Editing Message</span>
                    <span className="text-gray-600 truncate text-[11px]">
                      {editingMessage.message}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1 rounded-full hover:bg-amber-100 text-gray-500 hover:text-red-500 transition-all cursor-pointer"
                  title="Cancel edit"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
            )}


            {/* Language Selector Dropdown (Speech-to-text) */}
            {showLangMenu && (
              <div className="absolute bottom-[75px] left-12 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-30 flex flex-col gap-1 w-44 animate-fadeIn text-xs">
                <span className="text-[10px] uppercase font-bold text-gray-400 px-2 py-1">Voice Typing Language</span>
                <button
                  type="button"
                  onClick={() => { setSpeechLanguage("hi-IN"); setShowLangMenu(false); }}
                  className={`text-left px-2.5 py-1.5 rounded-xl font-medium cursor-pointer ${speechLanguage === "hi-IN" ? "bg-cyan-50 text-[#1797c2] font-bold" : "hover:bg-slate-50 text-gray-700"}`}
                >
                  🇮🇳 हिन्दी (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => { setSpeechLanguage("en-IN"); setShowLangMenu(false); }}
                  className={`text-left px-2.5 py-1.5 rounded-xl font-medium cursor-pointer ${speechLanguage === "en-IN" ? "bg-cyan-50 text-[#1797c2] font-bold" : "hover:bg-slate-50 text-gray-700"}`}
                >
                  🇮🇳 English (India)
                </button>
                <button
                  type="button"
                  onClick={() => { setSpeechLanguage("en-US"); setShowLangMenu(false); }}
                  className={`text-left px-2.5 py-1.5 rounded-xl font-medium cursor-pointer ${speechLanguage === "en-US" ? "bg-cyan-50 text-[#1797c2] font-bold" : "hover:bg-slate-50 text-gray-700"}`}
                >
                  🇺🇸 English (US)
                </button>
              </div>
            )}

            {/* 🔴 RECORDING IN PROGRESS VIEW */}
            {isRecording ? (
              <div className="w-full max-w-4xl h-[50px] sm:h-[55px] bg-red-50/90 border border-red-200 rounded-full shadow-inner flex items-center justify-between px-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                  <span className="text-red-700 font-bold text-sm">
                    Recording: {formatSeconds(recordingDuration)}
                  </span>
                  {/* Bouncing Audio Waveform Bars */}
                  <div className="flex items-center gap-1 ml-2">
                    <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
                    <span className="w-1 h-5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                    <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.6s]"></span>
                    <span className="w-1 h-6 bg-red-500 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                    <span className="w-1 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Cancel / Trash */}
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="p-2 text-gray-500 hover:text-red-600 cursor-pointer transition-all active:scale-95"
                    title="Cancel recording"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>

                  {/* Stop & Preview */}
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <FaStop className="w-3 h-3" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ) : recordedAudioBlob ? (
              /* 🎧 RECORDED AUDIO PREVIEW VIEW */
              <div className="w-full max-w-4xl h-[50px] sm:h-[55px] bg-cyan-50 border border-cyan-200 rounded-full shadow-inner flex items-center justify-between px-4 animate-fadeIn">
                <audio
                  ref={previewAudioRef}
                  src={recordedAudioUrl}
                  onEnded={() => setIsPlayingPreview(false)}
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePreviewPlay}
                    className="w-8 h-8 rounded-full bg-[#1797c2] hover:bg-[#127fa6] text-white flex items-center justify-center cursor-pointer shadow-sm transition-all"
                    title={isPlayingPreview ? "Pause" : "Play preview"}
                  >
                    {isPlayingPreview ? <FaPause className="w-3 h-3" /> : <FaPlay className="w-3 h-3 ml-0.5" />}
                  </button>
                  <span className="text-xs font-bold text-[#1797c2]">
                    Voice Note ({formatSeconds(recordingDuration)})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Cancel button */}
                  <button
                    type="button"
                    onClick={cancelRecording}
                    disabled={isUploadingAudio}
                    className="p-1.5 text-gray-500 hover:text-red-500 cursor-pointer transition-all"
                    title="Delete recording"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>

                  {/* Send Audio button */}
                  <button
                    type="button"
                    onClick={handleSendAudio}
                    disabled={isUploadingAudio}
                    className="px-4 py-1.5 rounded-full bg-[#1797c2] hover:bg-[#127fa6] text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isUploadingAudio ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <span>Send</span>
                        <RiSendPlane2Fill className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* 💬 NORMAL TEXT / VOICE INPUT BAR */
              <form
                onSubmit={handleSendMessage}
                className="w-full max-w-4xl h-[50px] sm:h-[55px] bg-slate-100 border border-gray-300 rounded-full shadow-inner flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4"
              >
                {/* Emoji Picker Button */}
                <button
                  type="button"
                  className="text-gray-500 hover:text-[#1797c2] cursor-pointer shrink-0 p-1"
                  onClick={() => setShowPicker((prev) => !prev)}
                  title="Emoji"
                >
                  <RiEmojiStickerLine className="w-6 h-6" />
                </button>

                {/* Voice Typing (Speech-to-Text) Toggle */}
                <div className="relative shrink-0 flex items-center">
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-1.5 rounded-full cursor-pointer transition-all ${
                      isListening
                        ? "text-red-500 animate-pulse bg-red-100 scale-110 shadow-sm"
                        : "text-gray-500 hover:text-[#1797c2]"
                    }`}
                    title={isListening ? "Stop voice typing" : `Voice Typing (${speechLanguage === "hi-IN" ? "Hindi" : speechLanguage})`}
                  >
                    <MdRecordVoiceOver className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLangMenu((prev) => !prev)}
                    className="text-[10px] font-bold text-gray-500 hover:text-[#1797c2] ml-0.5"
                    title="Change language"
                  >
                    {speechLanguage.split("-")[0].toUpperCase()}
                  </button>
                </div>

                <input
                  type="file"
                  hidden
                  ref={imageRef}
                  accept="image/jpeg, image/png, image/webp, image/jpg"
                  onChange={handleImageSelect}
                />

                <input
                  type="text"
                  placeholder={
                    editingMessage
                      ? "Edit message content..."
                      : isListening
                      ? "Listening... Speak now 🎙️"
                      : isGroupChat
                      ? `Message #${selectedGroup.name}...`
                      : "Type a message..."
                  }
                  value={input}
                  onChange={handleInputChange}
                  className={`w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm sm:text-base px-1 ${
                    isListening ? "italic text-[#1797c2]" : ""
                  }`}
                />

                {/* Image Upload Button (disabled during edit) */}
                {!editingMessage && (
                  <button
                    type="button"
                    className="text-gray-500 hover:text-[#1797c2] cursor-pointer shrink-0 p-1"
                    onClick={() => imageRef.current.click()}
                    title="Send Image"
                  >
                    <FaImages className="w-5 h-5" />
                  </button>
                )}

                {/* WhatsApp Style Mic (Record Voice Note) OR Send / Save Button */}
                {input.trim() || editingMessage ? (
                  <button 
                    type="submit" 
                    className={`w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-all active:scale-95 ${
                      editingMessage ? "bg-amber-500 hover:bg-amber-600" : "bg-[#1797c2] hover:bg-[#1280a5]"
                    }`}
                    title={editingMessage ? "Save edit" : "Send"}
                  >
                    <RiSendPlane2Fill className="w-4 h-4 ml-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-10 h-10 rounded-full bg-[#1797c2] hover:bg-[#1280a5] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-all"
                    title="Record voice note"
                  >
                    <FaMicrophone className="w-4 h-4" />
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 bg-slate-50">
          <div className="w-20 h-20 rounded-full bg-cyan-100 flex items-center justify-center text-[#1797c2] text-4xl mb-4 shadow-sm">
            💬
          </div>
          <h1 className="text-gray-700 font-extrabold text-2xl sm:text-3xl">
            Welcome to Chatly
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-sm">
            Select a direct chat or group from the sidebar to start messaging!
          </p>
        </div>
      )}

      {/* Forward Message Modal */}
      <ForwardModal
        isOpen={isForwardOpen}
        onClose={() => {
          setIsForwardOpen(false);
          setForwardingMessage(null);
        }}
        messageToForward={forwardingMessage}
        onForwardSuccess={() => {}}
      />

      {/* Group Info Modal */}
      {selectedGroup && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          group={selectedGroup}
        />
      )}

      {/* Mic Permission Guidance Modal */}
      <MicPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onTryAgain={() => {
          setShowPermissionModal(false);
          startRecording();
        }}
      />

      {/* 🖼️ Image Preview Before Sending Modal */}
      <ImagePreviewModal
        isOpen={isImagePreviewOpen}
        onClose={handleCloseImagePreview}
        imageFile={selectedImageFile}
        previewUrl={selectedImagePreviewUrl}
        onSend={handleSendImage}
        isUploading={isUploadingImage}
      />

      {/* 🔍 Full-Screen Image Lightbox Viewer Modal */}
      <ImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={handleCloseImageViewer}
        imageData={viewerImageData}
      />
    </div>
  );
}

export default MessageArea;
