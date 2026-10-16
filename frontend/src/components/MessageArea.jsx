import React, { useEffect, useRef, useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoInformationCircleOutline, IoVideocam } from "react-icons/io5";
import { MdGroups } from "react-icons/md";
import dp from "../assets/dp.webp";
import { RiEmojiStickerLine } from "react-icons/ri";
import { FaImages } from "react-icons/fa6";
import { RiSendPlane2Fill } from "react-icons/ri";
import EmojiPicker from "emoji-picker-react";
import SenderMessage from "./SenderMessage";
import ReceiverMessage from "./ReceiverMessage";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, setSelectedUser, setSelectedGroup } from "@/redux/userSlice";
import axios from "axios";
import { server_url } from "@/utils/constant";
import { useSocketContext } from "@/context/SocketContext";
import { useCallContext } from "@/context/CallContext";
import GroupInfoModal from "./GroupInfoModal";

function MessageArea() {
  const dispatch = useDispatch();
  const { selectedUser, selectedGroup, messages, userData } = useSelector((store) => store.auth);
  const { socket, onlineUsers } = useSocketContext();
  const { startCall } = useCallContext();

  const [showPicker, setShowPicker] = useState(false);
  const [input, setInput] = useState("");
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [groupTypingUser, setGroupTypingUser] = useState(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

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
      if (selectedUser?._id && String(selectedUser._id) === String(newMessage.sender)) {
        dispatch(setMessages([...messages, newMessage]));
        setIsTyping(false);
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

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("newMessage", handleNewMessage);
    socket.on("group_typing", handleGroupTyping);
    socket.on("group_stop_typing", handleGroupStopTyping);
    socket.on("newGroupMessage", handleNewGroupMessage);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("newMessage", handleNewMessage);
      socket.off("group_typing", handleGroupTyping);
      socket.off("group_stop_typing", handleGroupStopTyping);
      socket.off("newGroupMessage", handleNewGroupMessage);
    };
  }, [socket, selectedUser?._id, selectedGroup?._id, messages, userData?._id, dispatch]);

  // 🔹 Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, groupTypingUser]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input && !backendImage) return;

    // Clear typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket) {
      if (isGroupChat) {
        socket.emit("group_stop_typing", { groupId: selectedGroup._id });
      } else if (selectedUser?._id) {
        socket.emit("stop_typing", { receiverId: selectedUser._id });
      }
    }

    try {
      const formData = new FormData();
      formData.append("message", input);
      if (backendImage) {
        formData.append("image", backendImage);
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
        // Note: New group message is also broadcast via socket, but if socket loop is delayed, append locally:
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

  const handleBack = () => {
    if (selectedUser) dispatch(setSelectedUser(null));
    if (selectedGroup) dispatch(setSelectedGroup(null));
  };

  return (
    <div className={`w-full lg:flex-1 h-full bg-slate-200 relative overflow-hidden ${activeChat ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}>
      {activeChat ? (
        <div className="w-full h-full flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="w-full h-[65px] sm:h-[75px] bg-[#1797c2] shadow-md flex items-center justify-between px-3 sm:px-5 shrink-0 z-10">
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

            {/* Header Right Actions */}
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
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startCall(selectedUser, "video")}
                  className="w-10 h-10 rounded-full hover:bg-white/20 active:scale-95 flex items-center justify-center cursor-pointer text-white transition-all shrink-0"
                  title="Start Video Call"
                >
                  <IoVideocam className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
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

            {messages?.map((mess, index) => {
              const senderId = mess.sender?._id || mess.sender;
              const isMine = String(senderId) === String(userData?._id);

              return (
                <div key={mess._id || index} ref={index === messages.length - 1 ? scrollRef : null}>
                  {isMine ? (
                    <SenderMessage
                      image={mess.image}
                      message={mess.message}
                      userImage={userData?.image}
                    />
                  ) : (
                    <ReceiverMessage
                      image={mess.image}
                      message={mess.message}
                      userImage={isGroupChat ? (mess.sender?.image || dp) : (selectedUser?.image || dp)}
                      senderName={isGroupChat ? (mess.sender?.name || mess.sender?.userName) : null}
                    />
                  )}
                </div>
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
                placeholder={isGroupChat ? `Message #${selectedGroup.name}...` : "Type a message..."}
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
            Select a direct chat or group from the sidebar to start messaging!
          </p>
        </div>
      )}

      {/* Group Info Modal */}
      {selectedGroup && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          group={selectedGroup}
        />
      )}
    </div>
  );
}

export default MessageArea;
