import React, { useEffect, useRef, useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import dp from "../assets/dp.webp";
import { RiEmojiStickerLine } from "react-icons/ri";
import { FaImages } from "react-icons/fa6";
import { RiSendPlane2Fill } from "react-icons/ri";
import EmojiPicker from "emoji-picker-react";
import SenderMessage from "./SenderMessage";
import ReceiverMessage from "./ReceiverMessage";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, setSelectedUser } from "@/redux/userSlice";
import axios from "axios";
import { server_url } from "@/utils/constant";
import { useSocketContext } from "@/context/SocketContext";

function MessageArea() {
  const dispatch = useDispatch();
  const { selectedUser, messages, userData } = useSelector((store) => store.auth);
  const { socket, onlineUsers } = useSocketContext();

  const [showPicker, setShowPicker] = useState(false);
  const [input, setInput] = useState("");
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const imageRef = useRef();
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);

  const isOnline = Boolean(
    selectedUser?._id && onlineUsers?.some((id) => String(id) === String(selectedUser._id))
  );

  // 🔹 Fetch messages
  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`${server_url}/api/message/${selectedUser._id}`, { withCredentials: true });
          dispatch(setMessages(res.data));
        } catch (error) {
          console.log(error);
        }
      };
      fetchMessages();
      setIsTyping(false);
    }
  }, [selectedUser?._id, dispatch]);

  // 🔹 Real-time socket listeners (Typing indicator & New incoming messages)
  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ senderId }) => {
      if (selectedUser?._id === senderId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (selectedUser?._id === senderId) {
        setIsTyping(false);
      }
    };

    const handleNewMessage = (newMessage) => {
      if (selectedUser?._id === newMessage.sender) {
        dispatch(setMessages([...messages, newMessage]));
        setIsTyping(false);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedUser?._id, messages, dispatch]);

  // 🔹 Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  // 🔹 Handle typing input change with auto-debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (!socket || !selectedUser?._id) return;

    if (value.trim().length > 0) {
      socket.emit("typing", { receiverId: selectedUser._id });

      // Clear any existing stop_typing timer
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 1.5 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { receiverId: selectedUser._id });
      }, 1500);
    } else {
      socket.emit("stop_typing", { receiverId: selectedUser._id });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input && !backendImage) return;

    // Stop typing indicator immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socket && selectedUser?._id) {
      socket.emit("stop_typing", { receiverId: selectedUser._id });
    }

    try {
      const formData = new FormData();
      formData.append("message", input);
      if (backendImage) {
        formData.append("image", backendImage);
      }

      const res = await axios.post(
        `${server_url}/api/message/send/${selectedUser._id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      dispatch(setMessages([...messages, res.data]));
      setInput("");
      setFrontendImage(null);
      setBackendImage(null);
    } catch (error) {
      console.log(error);
    }
  };

  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className={`w-full lg:flex-1 h-full bg-slate-200 relative overflow-hidden ${selectedUser ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}>
      {selectedUser ? (
        <div className="w-full h-full flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="w-full h-[65px] sm:h-[75px] bg-[#1797c2] shadow-md flex items-center justify-between px-3 sm:px-5 shrink-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <button 
                type="button"
                className="w-10 h-10 rounded-full hover:bg-white/10 active:scale-95 flex items-center justify-center cursor-pointer text-white transition-all shrink-0"
                onClick={() => dispatch(setSelectedUser(null))}
                title="Back to chat list"
              >
                <IoIosArrowRoundBack className="w-8 h-8 text-white" />
              </button>

              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white shadow-sm border border-white/60">
                  <img src={selectedUser.image || dp} alt="" className="h-full w-full object-cover" />
                </div>
                {isOnline && (
                  <span className="w-3 h-3 bg-emerald-400 border-2 border-white rounded-full absolute bottom-0 right-0 shadow-sm"></span>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <h1 className="text-white font-semibold text-base sm:text-lg leading-tight truncate max-w-[170px] sm:max-w-[320px]">
                  {selectedUser.name || selectedUser.userName}
                </h1>
                {isTyping ? (
                  <span className="text-xs text-white/95 font-medium italic flex items-center gap-1 animate-pulse">
                    typing...
                  </span>
                ) : isOnline ? (
                  <span className="text-[11px] text-emerald-300 font-medium">Online</span>
                ) : (
                  <span className="text-[11px] text-white/70">Offline</span>
                )}
              </div>
            </div>
          </div>

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

            {messages?.map((mess, index) => (
              <div key={index} ref={index === messages.length - 1 ? scrollRef : null}>
                {mess.sender === userData?._id ? (
                  <SenderMessage
                    image={mess.image}
                    message={mess.message}
                  />
                ) : (
                  <ReceiverMessage
                    image={mess.image}
                    message={mess.message}
                  />
                )}
              </div>
            ))}

            {/* Floating Typing Indicator in chat */}
            {isTyping && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-2xl w-fit shadow-sm text-gray-600 text-xs self-start my-1 animate-fadeIn border border-gray-100">
                <span className="font-semibold text-[#1797c2]">
                  {selectedUser.name || selectedUser.userName} is typing
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
          <div className="w-full p-2.5 sm:p-4 bg-white/95 backdrop-blur-md border-t border-gray-300 shrink-0 flex items-center justify-center relative">
            {frontendImage && (
              <div className="absolute bottom-[75px] left-4 bg-white p-1 rounded-xl shadow-xl border border-gray-200 animate-fadeIn z-20">
                <img
                  src={frontendImage}
                  alt="preview"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFrontendImage(null);
                    setBackendImage(null);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="w-full max-w-4xl h-[50px] sm:h-[55px] bg-slate-100 border border-gray-300 rounded-full shadow-inner flex items-center gap-2 px-3 sm:px-4"
            >
              <button
                type="button"
                className="text-gray-500 hover:text-[#1797c2] cursor-pointer shrink-0 p-1"
                onClick={() => setShowPicker((prev) => !prev)}
                title="Emoji"
              >
                <RiEmojiStickerLine className="w-6 h-6" />
              </button>

              <input
                type="file"
                hidden
                ref={imageRef}
                accept="image/*"
                onChange={handleImage}
              />

              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={handleInputChange}
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm sm:text-base px-1"
              />

              <button
                type="button"
                className="text-gray-500 hover:text-[#1797c2] cursor-pointer shrink-0 p-1"
                onClick={() => imageRef.current.click()}
                title="Send Image"
              >
                <FaImages className="w-5 h-5" />
              </button>

              {(input.trim() || frontendImage) && (
                <button 
                  type="submit" 
                  className="w-9 h-9 rounded-full bg-[#1797c2] hover:bg-[#1280a5] text-white flex items-center justify-center shrink-0 shadow cursor-pointer transition-all active:scale-95"
                >
                  <RiSendPlane2Fill className="w-4 h-4 ml-0.5" />
                </button>
              )}
            </form>
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
            Select a user from the list to start a conversation!
          </p>
        </div>
      )}
    </div>
  );
}

export default MessageArea;

