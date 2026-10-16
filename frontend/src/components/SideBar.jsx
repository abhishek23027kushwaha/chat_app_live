import React, { useEffect, useState } from 'react'
import dp from "../assets/dp.webp"
import { IoIosSearch } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import { BiLogOutCircle } from "react-icons/bi";
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { server_url } from '@/utils/constant';
import { setOtherUsers, setSelectedUser, setUserData } from '@/redux/userSlice';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '@/context/SocketContext';

function SideBar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userData, otherUsers, selectedUser } = useSelector(store => store.auth)
  const { onlineUsers } = useSocketContext()

  const [search, setSearch] = useState(false)
  const [input, setInput] = useState("")

  // 🔹 Fetch other users
  useEffect(() => {
    const fetchOtherUsers = async () => {
      try {
        const res = await axios.get(`${server_url}/api/user/others`, { withCredentials: true });
        console.log("Other users fetched:", res.data);
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
      dispatch(setOtherUsers([]));
      navigate("/login");
    }
  };

  const filteredUsers = otherUsers?.filter(user => {
    const name = user.name?.toLowerCase() || "";
    const userName = user.userName?.toLowerCase() || "";
    const searchInput = input.toLowerCase();
    return name.includes(searchInput) || userName.includes(searchInput);
  });

  return (
    <div className={`w-full lg:w-[350px] xl:w-[400px] h-full bg-slate-100 flex flex-col border-r border-gray-300 shrink-0 ${selectedUser ? "hidden" : "flex"} lg:flex`}>

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
              <p className="text-xs text-white/95 font-medium truncate max-w-[160px] sm:max-w-[200px]">
                Hii, {userData?.name || userData?.userName}
              </p>
            </div>
          </div>

          {/* Action buttons (Search & Logout) */}
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setSearch(!search)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Search Users"
            >
              <IoIosSearch className="w-5 h-5 text-white" />
            </button>
            <button 
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-red-500/80 flex items-center justify-center cursor-pointer transition-all active:scale-95"
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
              placeholder="Search users..."
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

      {/* Users List Heading / Subtitle */}
      <div className="px-4 pt-3 pb-1 flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span>Conversations ({filteredUsers?.length || 0})</span>
      </div>

      {/* Users List Container */}
      <div className="w-full flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {filteredUsers?.length > 0 ? (
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
        )}
      </div>

    </div>
  );
}

export default SideBar;
