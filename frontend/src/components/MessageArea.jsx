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

  const isOnline = onlineUsers?.includes(selectedUser?._id);

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
    <div className="lg:w-[70%] w-full h-full bg-slate-200 border-l-2 border-gray-300 relative overflow-hidden">
      {selectedUser ? (
        <div className="w-full h-[100vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="w-full h-[100px] bg-[#1797c2] rounded-b-[30px] shadow-lg flex items-center justify-between px-[20px]">
            <div className="flex items-center gap-[15px]">
              <div className="cursor-pointer" onClick={() => dispatch(setSelectedUser(null))}>
                <IoIosArrowRoundBack className="w-[40px] h-[40px] text-white" />
              </div>

              <div className="relative">
                <div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-white shadow-lg">
                  <img src={selectedUser.image || dp} alt="" className="h-full w-full object-cover" />
                </div>
                {isOnline && (
                  <span className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full absolute bottom-0 right-0"></span>
                )}
              </div>

              <div className="flex flex-col">
                <h1 className="text-white font-semibold text-[20px] leading-tight">
                  {selectedUser.name || selectedUser.userName}
                </h1>
                {isTyping ? (
                  <span className="text-xs text-white/95 font-medium italic flex items-center gap-1 animate-pulse">
                    typing...
                  </span>
                ) : isOnline ? (
                  <span className="text-xs text-emerald-300 font-medium">Online</span>
                ) : (
                  <span className="text-xs text-white/70">Offline</span>
                )}
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="w-full flex-1 py-[20px] px-[20px] overflow-auto gap-[15px] flex flex-col">
            {showPicker && (
              <div className="absolute bottom-[120px] left-[20px] z-50">
                <EmojiPicker
                  width={250}
                  height={350}
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
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-2xl w-fit shadow-md text-gray-600 text-xs self-start my-1 animate-fadeIn">
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
          <div className="w-full h-[100px] flex items-center justify-center">
            {frontendImage && (
              <img
                src={frontendImage}
                alt=""
                className="w-[80px] absolute bottom-[110px] right-[20%] rounded-lg shadow-lg"
              />
            )}

            <form
              onSubmit={handleSendMessage}
              className="w-[95%] lg:w-[70%] h-[60px] bg-[#1797c2] rounded-full shadow-lg flex items-center gap-[20px] px-[20px]"
            >
              <RiEmojiStickerLine
                className="w-[25px] h-[25px] text-white cursor-pointer"
                onClick={() => setShowPicker((prev) => !prev)}
              />

              <input
                type="file"
                hidden
                ref={imageRef}
                accept="image/*"
                onChange={handleImage}
              />

              <input
                type="text"
                placeholder="Message"
                value={input}
                onChange={handleInputChange}
                className="w-full bg-transparent outline-none text-white placeholder-white text-[18px]"
              />

              <FaImages
                className="w-[25px] h-[25px] text-white cursor-pointer"
                onClick={() => imageRef.current.click()}
              />

              {(input || frontendImage) && (
                <button type="submit" className="cursor-pointer">
                  <RiSendPlane2Fill className="w-[25px] h-[25px] text-white" />
                </button>
              )}
            </form>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col justify-center items-center">
          <h1 className="text-gray-700 font-bold text-[50px]">
            Welcome to Chatly
          </h1>
          <span className="text-gray-700 font-semibold text-[30px]">
            Chat Friendly !
          </span>
        </div>
      )}
    </div>
  );
}

export default MessageArea;

