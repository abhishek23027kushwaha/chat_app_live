import React, { useState } from "react";
import dp from "../assets/dp.webp";
import AudioPlayer from "./AudioPlayer";
import {
  MdOutlineReply,
  MdOutlineEdit,
  MdOutlineDelete,
  MdMoreVert,
} from "react-icons/md";
import { RiShareForwardFill } from "react-icons/ri";
import { formatMessageTime } from "../utils/dateUtils";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function SenderMessage({
  messageObj,
  userImage,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onForward,
  onScrollToMessage,
  currentUserId,
  isHighlighted = false,
}) {
  const [showMenu, setShowMenu] = useState(false);

  const {
    _id,
    message,
    image,
    audio,
    audioDuration,
    replyTo,
    reactions = [],
    isEdited,
    isDeleted,
    isForwarded,
    createdAt,
  } = messageObj || {};

  const formattedTime = formatMessageTime(createdAt);

  // Group reactions by emoji
  const groupedReactions = (reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      id={`msg-${_id}`}
      className={`relative group flex items-start justify-end gap-2.5 my-1.5 transition-all ${
        isHighlighted ? "bg-amber-100/60 p-2 rounded-2xl ring-2 ring-amber-400" : ""
      }`}
    >
      {/* FLOATING ACTION TOOLBAR (Appears on hover or menu toggle) */}
      {!isDeleted && (
        <div
          className={`absolute -top-7 right-12 z-20 items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full shadow-lg border border-gray-200 transition-all ${
            showMenu ? "flex" : "hidden group-hover:flex"
          }`}
        >
          {/* Quick Reaction Emojis */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact(_id, emoji);
                  setShowMenu(false);
                }}
                className="w-6 h-6 hover:scale-125 flex items-center justify-center text-xs transition-transform cursor-pointer"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Button */}
          <button
            type="button"
            onClick={() => {
              onReply(messageObj);
              setShowMenu(false);
            }}
            className="p-1 hover:bg-slate-100 rounded-full text-gray-600 hover:text-[#1797c2] transition-all cursor-pointer"
            title="Reply"
          >
            <MdOutlineReply className="w-4 h-4" />
          </button>

          {/* Forward Button */}
          <button
            type="button"
            onClick={() => {
              onForward(messageObj);
              setShowMenu(false);
            }}
            className="p-1 hover:bg-slate-100 rounded-full text-gray-600 hover:text-[#1797c2] transition-all cursor-pointer"
            title="Forward"
          >
            <RiShareForwardFill className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button (Only if text message) */}
          {message && !audio && !image && (
            <button
              type="button"
              onClick={() => {
                onEdit(messageObj);
                setShowMenu(false);
              }}
              className="p-1 hover:bg-slate-100 rounded-full text-gray-600 hover:text-emerald-600 transition-all cursor-pointer"
              title="Edit"
            >
              <MdOutlineEdit className="w-4 h-4" />
            </button>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => {
              onDelete(_id);
              setShowMenu(false);
            }}
            className="p-1 hover:bg-slate-100 rounded-full text-gray-600 hover:text-red-600 transition-all cursor-pointer"
            title="Delete for everyone"
          >
            <MdOutlineDelete className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* THREE-DOT MOBILE TOGGLE */}
      {!isDeleted && (
        <button
          type="button"
          onClick={() => setShowMenu((prev) => !prev)}
          className="self-center p-1 text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100 lg:hidden cursor-pointer"
        >
          <MdMoreVert className="w-4 h-4" />
        </button>
      )}

      {/* MESSAGE BUBBLE */}
      <div className="w-fit max-w-[480px] px-3.5 py-2.5 bg-[rgb(23,151,194)] text-white text-[15px] sm:text-[16px] rounded-tr-none rounded-2xl shadow-md flex flex-col gap-1.5 relative">
        
        {/* Forwarded Header */}
        {isForwarded && (
          <div className="flex items-center gap-1 text-[11px] text-white/80 italic mb-0.5">
            <RiShareForwardFill className="w-3.5 h-3.5" />
            <span>Forwarded</span>
          </div>
        )}

        {/* Reply Quoted Card */}
        {replyTo && (
          <div
            onClick={() => onScrollToMessage && onScrollToMessage(replyTo._id)}
            className="p-2 rounded-xl bg-black/15 border-l-4 border-amber-300 text-xs cursor-pointer hover:bg-black/25 transition-all text-white/90"
            title="Click to view original message"
          >
            <span className="font-bold text-amber-200 block text-[11px]">
              {replyTo.sender?.name || replyTo.sender?.userName || "Someone"}
            </span>
            <span className="truncate block text-[11px] text-white/80">
              {replyTo.message || (replyTo.audio ? "🎙️ Voice note" : "📷 Photo")}
            </span>
          </div>
        )}

        {/* Image Attachment */}
        {image && !isDeleted && (
          <img
            src={image}
            alt="msg"
            className="w-[180px] sm:w-[220px] rounded-xl object-cover shadow-xs"
          />
        )}

        {/* Audio Attachment */}
        {audio && !isDeleted && (
          <AudioPlayer src={audio} initialDuration={audioDuration} isSender={true} />
        )}

        {/* Text Message */}
        {isDeleted ? (
          <span className="italic text-white/70 text-xs flex items-center gap-1 py-1">
            🚫 <i>This message was deleted</i>
          </span>
        ) : (
          message && (
            <div className="leading-snug break-words">
              <span>{message}</span>
            </div>
          )
        )}

        {/* Message Footer: Edited Label + Original Send Time in Local Timezone */}
        {!isDeleted && (
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-white/80 self-end -mt-0.5 select-none font-medium">
            {isEdited && (
              <span className="italic opacity-90 text-[10px]">Edited</span>
            )}
            {formattedTime && (
              <span>{formattedTime}</span>
            )}
          </div>
        )}

        {/* Reaction Badges Pill */}
        {reactions?.length > 0 && !isDeleted && (
          <div className="flex items-center gap-1 mt-1 -mb-1 flex-wrap">
            {Object.entries(groupedReactions).map(([emoji, count]) => {
              const hasUserReacted = reactions.some(
                (r) =>
                  String(r.user?._id || r.user) === String(currentUserId) &&
                  r.emoji === emoji
              );

              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(_id, emoji)}
                  className={`px-1.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer ${
                    hasUserReacted
                      ? "bg-white text-gray-800 border border-cyan-300 font-bold"
                      : "bg-black/20 text-white hover:bg-black/30"
                  }`}
                  title={hasUserReacted ? "Click to remove reaction" : `React with ${emoji}`}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-[10px]">{count}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="w-[38px] h-[38px] sm:w-[40px] sm:h-[40px] rounded-full overflow-hidden flex justify-center items-center bg-white shadow-md shrink-0 border border-white/60">
        <img src={userImage || dp} alt="me" className="h-full w-full object-cover" />
      </div>

    </div>
  );
}

export default SenderMessage;
