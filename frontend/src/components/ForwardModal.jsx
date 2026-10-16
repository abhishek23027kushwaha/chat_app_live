import React, { useState } from "react";
import { RxCross2 } from "react-icons/rx";
import { IoIosSearch } from "react-icons/io";
import { RiShareForwardFill } from "react-icons/ri";
import { MdGroups, MdCheck } from "react-icons/md";
import dp from "../assets/dp.webp";
import axios from "axios";
import { server_url } from "@/utils/constant";
import { useSelector } from "react-redux";

function ForwardModal({ isOpen, onClose, messageToForward, onForwardSuccess }) {
  const { otherUsers, groups } = useSelector((store) => store.auth);

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !messageToForward) return null;

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleGroup = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const term = searchTerm.toLowerCase();

  const filteredUsers = (otherUsers || []).filter(
    (u) =>
      u.name?.toLowerCase().includes(term) ||
      u.userName?.toLowerCase().includes(term)
  );

  const filteredGroups = (groups || []).filter(
    (g) =>
      g.name?.toLowerCase().includes(term) ||
      g.description?.toLowerCase().includes(term)
  );

  const totalSelected = selectedUserIds.length + selectedGroupIds.length;

  const handleForward = async () => {
    if (totalSelected === 0) {
      setError("Please select at least one recipient");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await axios.post(
        `${server_url}/api/message/forward`,
        {
          messageId: messageToForward._id,
          destinationUserIds: selectedUserIds,
          destinationGroupIds: selectedGroupIds,
        },
        { withCredentials: true }
      );

      if (onForwardSuccess) onForwardSuccess();
      onClose();
    } catch (err) {
      console.error("Forward error:", err);
      setError(err.response?.data?.error || "Failed to forward message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1797c2] to-[#20c7ff] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <RiShareForwardFill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Forward Message</h3>
              <p className="text-xs text-white/90">Select chats to send this message</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-all"
          >
            <RxCross2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="px-5 py-3 bg-slate-50 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xs text-gray-500 font-semibold uppercase shrink-0">Forwarding:</span>
          <span className="text-xs text-gray-800 italic truncate max-w-[260px]">
            {messageToForward.message || (messageToForward.audio ? "🎙️ Voice note" : "📷 Photo")}
          </span>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <IoIosSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts or groups..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-[#1797c2]"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-2 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Chats Selection List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 divide-y divide-gray-100">
          
          {/* Direct Contacts */}
          {filteredUsers.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                Direct Contacts
              </span>
              <div className="space-y-1">
                {filteredUsers.map((user) => {
                  const isChecked = selectedUserIds.includes(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleUser(user._id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        isChecked ? "bg-cyan-50/70 border border-cyan-100" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={user.image || dp}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {user.name || user.userName}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">@{user.userName}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isChecked ? "bg-[#1797c2] text-white" : "border-2 border-gray-300 bg-white"
                        }`}
                      >
                        {isChecked && <MdCheck className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Groups */}
          {filteredGroups.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                Groups
              </span>
              <div className="space-y-1">
                {filteredGroups.map((group) => {
                  const isChecked = selectedGroupIds.includes(group._id);
                  return (
                    <div
                      key={group._id}
                      onClick={() => toggleGroup(group._id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        isChecked ? "bg-cyan-50/70 border border-cyan-100" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-cyan-100 border border-gray-200 flex items-center justify-center shrink-0">
                          {group.profileImage ? (
                            <img src={group.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <MdGroups className="w-5 h-5 text-[#1797c2]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{group.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {group.members?.length || 0} members
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isChecked ? "bg-[#1797c2] text-white" : "border-2 border-gray-300 bg-white"
                        }`}
                      >
                        {isChecked && <MdCheck className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && filteredGroups.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-400">
              No contacts or groups found
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            {totalSelected} chat{totalSelected !== 1 ? "s" : ""} selected
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleForward}
              disabled={isSubmitting || totalSelected === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1797c2] to-[#20c7ff] text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer active:scale-95"
            >
              {isSubmitting ? "Forwarding..." : `Forward (${totalSelected})`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ForwardModal;
