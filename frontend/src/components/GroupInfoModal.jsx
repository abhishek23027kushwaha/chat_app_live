import React, { useState } from "react";
import { RxCross2 } from "react-icons/rx";
import { MdGroups, MdPersonRemoveAlt1, MdExitToApp, MdPersonAddAlt1 } from "react-icons/md";
import { IoIosSearch } from "react-icons/io";
import dp from "../assets/dp.webp";
import axios from "axios";
import { server_url } from "@/utils/constant";
import { useDispatch, useSelector } from "react-redux";
import { updateGroupInList, removeGroupFromList, setSelectedGroup } from "@/redux/userSlice";

function GroupInfoModal({ isOpen, onClose, group }) {
  const dispatch = useDispatch();
  const { userData, otherUsers } = useSelector((store) => store.auth);

  const [showAddMember, setShowAddMember] = useState(false);
  const [searchAddUser, setSearchAddUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  if (!isOpen || !group) return null;

  const currentUserId = String(userData?._id);
  const adminId = String(group.admin?._id || group.admin);
  const isAdmin = currentUserId === adminId;

  // Existing member IDs in string format
  const currentMemberIds = (group.members || []).map((m) => String(m._id || m));

  // Users available to add (not already members)
  const usersAvailableToAdd = (otherUsers || []).filter(
    (u) => !currentMemberIds.includes(String(u._id))
  );

  const filteredAddUsers = usersAvailableToAdd.filter((u) => {
    const term = searchAddUser.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.userName?.toLowerCase().includes(term)
    );
  });

  // Handle Remove Member (Admin Only)
  const handleRemoveMember = async (memberId, memberName) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${memberName || "this member"} from the group?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setActionError("");
      const res = await axios.put(
        `${server_url}/api/group/remove-member/${group._id}`,
        { memberId },
        { withCredentials: true }
      );
      dispatch(updateGroupInList(res.data));
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Member (Admin Only)
  const handleAddMember = async (userId) => {
    try {
      setLoading(true);
      setActionError("");
      const res = await axios.put(
        `${server_url}/api/group/add-members/${group._id}`,
        { members: [userId] },
        { withCredentials: true }
      );
      dispatch(updateGroupInList(res.data));
      setShowAddMember(false);
      setSearchAddUser("");
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  // Handle Leave Group
  const handleLeaveGroup = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to leave this group? You will no longer receive group messages."
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setActionError("");
      await axios.put(
        `${server_url}/api/group/leave/${group._id}`,
        {},
        { withCredentials: true }
      );
      dispatch(removeGroupFromList(group._id));
      dispatch(setSelectedGroup(null));
      onClose();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || "Failed to leave group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1797c2] to-[#20c7ff] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MdGroups className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold truncate max-w-[240px] sm:max-w-[320px]">
                {group.name}
              </h2>
              <p className="text-xs text-white/90">
                {group.members?.length || 0} members • {isAdmin ? "You are Admin" : "Member"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
          >
            <RxCross2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
              {actionError}
            </div>
          )}

          {/* Group Avatar & Description */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-cyan-100 border-2 border-white shadow-sm shrink-0">
              <img
                src={group.profileImage || dp}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-base truncate">{group.name}</h3>
              <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                {group.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Group Members ({group.members?.length || 0})
              </h4>
              {isAdmin && !showAddMember && (
                <button
                  type="button"
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#1797c2] hover:text-[#127fa6] transition-all cursor-pointer bg-cyan-50 px-2.5 py-1 rounded-lg"
                >
                  <MdPersonAddAlt1 className="w-4 h-4" />
                  Add Member
                </button>
              )}
            </div>

            {/* Add Member inline drawer (Admin Only) */}
            {showAddMember && (
              <div className="mb-4 p-3 bg-cyan-50/60 rounded-2xl border border-cyan-100 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1797c2]">Select User to Add</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMember(false);
                      setSearchAddUser("");
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="relative">
                  <IoIosSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchAddUser}
                    onChange={(e) => setSearchAddUser(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 outline-none focus:border-[#1797c2]"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-gray-100 bg-white rounded-xl border border-gray-100">
                  {filteredAddUsers.length > 0 ? (
                    filteredAddUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleAddMember(user._id)}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={user.image || dp}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">
                              {user.name || user.userName}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">@{user.userName}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-[#1797c2] px-2 py-0.5 rounded bg-cyan-50">
                          Add +
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-gray-400">
                      No new users available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Current Member List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {group.members?.map((member) => {
                const memId = String(member._id || member);
                const isMemberAdmin = memId === adminId;
                const isSelf = memId === currentUserId;

                return (
                  <div
                    key={memId}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={member.image || dp}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {member.name || member.userName}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] text-gray-400 font-medium">(You)</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">@{member.userName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isMemberAdmin && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}

                      {/* Admin Remove Button */}
                      {isAdmin && !isMemberAdmin && !isSelf && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(memId, member.name || member.userName)}
                          disabled={loading}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
                          title="Remove from group"
                        >
                          <MdPersonRemoveAlt1 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave Group Action */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleLeaveGroup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <MdExitToApp className="w-4 h-4" />
              {loading ? "Processing..." : "Leave Group"}
            </button>
            {isAdmin && group.members?.length > 1 && (
              <p className="text-[10px] text-gray-400 text-center mt-1.5">
                Note: Since you are Admin, leaving will transfer admin privileges to the next member.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default GroupInfoModal;
