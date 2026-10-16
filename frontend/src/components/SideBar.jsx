import React, { useEffect, useState } from 'react'
import dp from "../assets/dp.webp"
import { IoIosSearch } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import { BiLogOutCircle } from "react-icons/bi";
import { MdGroupAdd, MdGroups } from "react-icons/md";
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { server_url } from '@/utils/constant';
import {
  setOtherUsers,
  setSelectedUser,
  setUserData,
  setGroups,
  setSelectedGroup,
  updateGroupInList,
  removeGroupFromList,
} from '@/redux/userSlice';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '@/context/SocketContext';
import CreateGroupModal from './CreateGroupModal';

function SideBar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userData, otherUsers, selectedUser, groups, selectedGroup } = useSelector(store => store.auth)
  const { socket, onlineUsers } = useSocketContext()

  const [search, setSearch] = useState(false)
  const [input, setInput] = useState("")
  const [activeTab, setActiveTab] = useState("chats") // "chats" | "groups"
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)

  // 🔹 Fetch other users
  useEffect(() => {
    const fetchOtherUsers = async () => {
      try {
        const res = await axios.get(`${server_url}/api/user/others`, { withCredentials: true });
        dispatch(setOtherUsers(res.data));
      } catch (error) {
        console.log(error);
        if (error.response?.status === 401) {
          dispatch(setUserData(null));
          navigate("/login");
        }
      }
    };
    if (userData) {
      fetchOtherUsers();
    }
  }, [dispatch, userData, navigate]);

  // 🔹 Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${server_url}/api/group/my-groups`, { withCredentials: true });
        dispatch(setGroups(res.data));
      } catch (error) {
        console.log("Error fetching groups:", error);
      }
    };
    if (userData) {
      fetchGroups();
    }
  }, [dispatch, userData]);

  // 🔹 Socket listeners for live Group updates
  useEffect(() => {
    if (!socket) return;

    const handleNewGroup = (newGroup) => {
      dispatch(setGroups([newGroup, ...(groups || [])]));
    };

    const handleGroupUpdated = (updatedGroup) => {
      dispatch(updateGroupInList(updatedGroup));
    };

    const handleRemovedFromGroup = ({ groupId }) => {
      dispatch(removeGroupFromList(groupId));
    };

    socket.on("newGroupAdded", handleNewGroup);
    socket.on("groupUpdated", handleGroupUpdated);
    socket.on("removedFromGroup", handleRemovedFromGroup);

    return () => {
      socket.off("newGroupAdded", handleNewGroup);
      socket.off("groupUpdated", handleGroupUpdated);
      socket.off("removedFromGroup", handleRemovedFromGroup);
    };
  }, [socket, groups, dispatch]);

  // 🔹 Fetch current user if not present
  useEffect(() => {
    if (!userData) {
      const fetchCurrentUser = async () => {
        try {
          const res = await axios.get(`${server_url}/api/user/current`, { withCredentials: true });
          dispatch(setUserData(res.data));
        } catch (error) {
          console.log(error);
          dispatch(setUserData(null));
          navigate("/login");
        }
      };
      fetchCurrentUser();
    }
  }, [userData, dispatch, navigate]);

  const handleLogout = async () => {
    try {
      await axios.get(`${server_url}/api/auth/logout`, { withCredentials: true });
    } catch (error) {
      console.log(error);
    } finally {
      dispatch(setUserData(null));
      dispatch(setSelectedUser(null));
      dispatch(setSelectedGroup(null));
      dispatch(setOtherUsers([]));
      dispatch(setGroups([]));
      navigate("/login");
    }
  };

  const filteredUsers = otherUsers?.filter(user => {
    const name = user.name?.toLowerCase() || "";
    const userName = user.userName?.toLowerCase() || "";
    const searchInput = input.toLowerCase();
    return name.includes(searchInput) || userName.includes(searchInput);
  });

  const filteredGroups = (groups || []).filter(group => {
    const name = group.name?.toLowerCase() || "";
    const description = group.description?.toLowerCase() || "";
    const searchInput = input.toLowerCase();
    return name.includes(searchInput) || description.includes(searchInput);
  });

  const activeChat = selectedUser || selectedGroup;

  return (
    <div className={`w-full lg:w-[350px] xl:w-[400px] h-full bg-slate-100 flex flex-col border-r border-gray-300 shrink-0 ${activeChat ? "hidden" : "flex"} lg:flex`}>

      {/* Modern Top Header */}
      <div className="w-full bg-gradient-to-r from-[#1797c2] to-[#20c7ff] text-white p-4 shadow-md shrink-0">
        <div className="flex items-center justify-between">
          
          {/* User profile & Greeting */}
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer hover:opacity-90 transition-all shrink-0"
              onClick={() => navigate("/profile")}
              title="Click to edit profile"
            >
              <img src={userData?.image || dp} alt="profile" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex flex-col">
              <h1 className="font-extrabold text-xl leading-tight tracking-wide">chatly</h1>
              <p className="text-xs text-white/95 font-medium truncate max-w-[140px] sm:max-w-[180px]">
                Hii, {userData?.name || userData?.userName}
              </p>
            </div>
          </div>

          {/* Action buttons (Create Group, Search & Logout) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              type="button"
              onClick={() => setIsCreateGroupOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Create New Group"
            >
              <MdGroupAdd className="w-5 h-5 text-white" />
            </button>
            <button 
              type="button"
              onClick={() => setSearch(!search)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Search"
            >
              <IoIosSearch className="w-5 h-5 text-white" />
            </button>
            <button 
              type="button"
              onClick={handleLogout}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-red-500/80 flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Logout"
            >
              <BiLogOutCircle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
        {search && (
          <div className="mt-3 w-full bg-white rounded-xl shadow-inner flex items-center px-3 py-2 gap-2 animate-fadeIn">
            <IoIosSearch className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={activeTab === "chats" ? "Search users..." : "Search groups..."}
              className="w-full text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <RxCross2
              className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
              onClick={() => {
                setSearch(false);
                setInput("");
              }}
            />
          </div>
        )}
      </div>

      {/* Modern Tab Switcher */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl mx-3 mt-3 mb-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "chats"
              ? "bg-white text-[#1797c2] shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>Direct Chats</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-gray-600">
            {filteredUsers?.length || 0}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("groups")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "groups"
              ? "bg-white text-[#1797c2] shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <MdGroups className="w-4 h-4" />
          <span>Groups</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-gray-600">
            {filteredGroups?.length || 0}
          </span>
        </button>
      </div>

      {/* Main List Container */}
      <div className="w-full flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {activeTab === "chats" ? (
          // 🔹 DIRECT CHATS LIST
          filteredUsers?.length > 0 ? (
            filteredUsers.map((user) => {
              const isUserOnline = Boolean(user?._id && onlineUsers?.some(id => String(id) === String(user._id)));
              const isSelected = Boolean(selectedUser?._id && String(selectedUser._id) === String(user._id));

              return (
                <div
                  key={user._id}
                  onClick={() => dispatch(setSelectedUser(user))}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#20c7ff] text-white shadow-md"
                      : "bg-white hover:bg-slate-50 text-gray-800 shadow-sm border border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {/* Avatar with Online Badge */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={user.image || dp} alt="" className="w-full h-full object-cover" />
                    </div>
                    {isUserOnline && (
                      <span className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full absolute bottom-0 right-0 shadow-sm"></span>
                    )}
                  </div>

                  {/* User Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-base truncate">
                        {user.name || user.userName}
                      </h2>
                      {isUserOnline ? (
                        <span className={`text-[11px] font-medium ${isSelected ? "text-white/90" : "text-emerald-500"}`}>
                          Online
                        </span>
                      ) : (
                        <span className={`text-[11px] ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                          Offline
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                      @{user.userName}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center py-16 flex flex-col items-center justify-center text-gray-400 text-sm">
              <p>No users found</p>
            </div>
          )
        ) : (
          // 🔹 GROUPS LIST
          filteredGroups?.length > 0 ? (
            filteredGroups.map((group) => {
              const isSelected = Boolean(selectedGroup?._id && String(selectedGroup._id) === String(group._id));
              const isAdmin = String(group.admin?._id || group.admin) === String(userData?._id);

              return (
                <div
                  key={group._id}
                  onClick={() => dispatch(setSelectedGroup(group))}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#20c7ff] text-white shadow-md"
                      : "bg-white hover:bg-slate-50 text-gray-800 shadow-sm border border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {/* Group Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-cyan-100 border border-gray-200 flex items-center justify-center">
                      {group.profileImage ? (
                        <img src={group.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <MdGroups className={`w-7 h-7 ${isSelected ? "text-white" : "text-[#1797c2]"}`} />
                      )}
                    </div>
                  </div>

                  {/* Group Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-base truncate">
                        {group.name}
                      </h2>
                      {isAdmin && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}>
                          Admin
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                      {group.members?.length || 0} members {group.description ? `• ${group.description}` : ""}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center py-16 flex flex-col items-center justify-center text-gray-400 text-sm space-y-2">
              <MdGroups className="w-10 h-10 text-gray-300" />
              <p>No groups joined yet</p>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                className="text-xs font-semibold text-[#1797c2] hover:underline cursor-pointer"
              >
                + Create a new group
              </button>
            </div>
          )
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

    </div>
  );
}

export default SideBar;
