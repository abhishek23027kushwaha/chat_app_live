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

function MessageArea() {
  const dispatch = useDispatch();
  const { selectedUser, messages, userData } = useSelector((store) => store.auth);

  const [showPicker, setShowPicker] = useState(false);
  const [input, setInput] = useState("");
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const imageRef = useRef();
  const scrollRef = useRef();

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
    }
  }, [selectedUser, dispatch]);

  // 🔹 Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input && !backendImage) return;

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
          <div className="w-full h-[100px] bg-[#1797c2] rounded-b-[30px] shadow-lg flex items-center gap-[20px] px-[20px]">
            <div className="cursor-pointer" onClick={() => dispatch(setSelectedUser(null))}>
              <IoIosArrowRoundBack className="w-[40px] h-[40px] text-white" />
            </div>
            <div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-white shadow-lg">
              <img src={selectedUser.image || dp} alt="" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-white font-semibold text-[20px]">
              {selectedUser.name || selectedUser.userName}
            </h1>
          </div>

          {/* Messages */}
          <div className="w-full flex-1 py-[30px] px-[20px] overflow-auto gap-[20px] flex flex-col">
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
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-transparent outline-none text-white placeholder-white text-[18px]"
              />

              <FaImages
                className="w-[25px] h-[25px] text-white cursor-pointer"
                onClick={() => imageRef.current.click()}
              />

              {(input || frontendImage) && (
                <button type="submit">
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
