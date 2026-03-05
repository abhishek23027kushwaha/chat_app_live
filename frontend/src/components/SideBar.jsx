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

function SideBar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userData, otherUsers, selectedUser } = useSelector(store => store.auth)

  const [search, setSearch] = useState(false)
  const [input, setInput] = useState("")

  // 🔹 Fetch other users
  useEffect(() => {
    const fetchOtherUsers = async () => {
      try {
        const res = await axios.get(`${server_url}/api/user/others`, { withCredentials: true })
        dispatch(setOtherUsers(res.data))
      } catch (error) {
        console.log(error)
      }
    }
    fetchOtherUsers()
  }, [dispatch])

  // 🔹 Fetch current user if not present (optional, usually set on login)
  useEffect(() => {
    if (!userData) {
      const fetchCurrentUser = async () => {
        try {
          const res = await axios.get(`${server_url}/api/user/current`, { withCredentials: true })
          dispatch(setUserData(res.data))
        } catch (error) {
          console.log(error)
        }
      }
      fetchCurrentUser()
    }
  }, [userData, dispatch])

  const handleLogout = async () => {
    try {
      await axios.get(`${server_url}/api/auth/logout`, { withCredentials: true })
      dispatch(setUserData(null))
      navigate("/login")
    } catch (error) {
      console.log(error)
    }
  }

  const filteredUsers = otherUsers?.filter(user =>
    user.name?.toLowerCase().includes(input.toLowerCase()) || 
    user.userName?.toLowerCase().includes(input.toLowerCase())
  )

  return (
    <div className={`lg:w-[30%] w-full h-full bg-slate-200 relative ${selectedUser ? "hidden" : "block"} lg:block`}>

      {/* Logout button */}
      <div 
        className='w-[60px] h-[60px] rounded-full bg-[#20c7ff] shadow-lg fixed bottom-[20px] left-[10px] flex justify-center items-center cursor-pointer z-50'
        onClick={handleLogout}
      >
        <BiLogOutCircle className='w-[25px] h-[25px]' />
      </div>

      {/* Header */}
      <div className='w-full h-[300px] bg-[#20c7ff] rounded-b-[30%] shadow-lg px-[20px] flex flex-col justify-center'>
        <h1 className='text-white font-bold text-[25px]'>chatly</h1>

        <div className='flex justify-between items-center'>
          <h1 className='text-gray-800 font-bold text-[25px]'>
            Hii , {userData?.name || userData?.userName}
          </h1>

          <div className='w-[60px] h-[60px] rounded-full bg-white shadow-lg overflow-hidden'>
            <img src={userData?.image || dp} alt="" className='h-full w-full object-cover'/>
          </div>
        </div>

        {/* Search */}
        <div className='mt-[20px]'>
          {!search && (
            <div
              className='w-[60px] h-[60px] rounded-full bg-white shadow-lg flex justify-center items-center cursor-pointer'
              onClick={() => setSearch(true)}
            >
              <IoIosSearch className='w-[25px] h-[25px]'/>
            </div>
          )}

          {search && (
            <div className='w-full h-[60px] bg-white rounded-full shadow-lg flex items-center px-[20px] gap-[10px]'>
              <IoIosSearch className='w-[25px] h-[25px]'/>
              <input
                type="text"
                placeholder='search users...'
                className='w-full outline-none bg-transparent'
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <RxCross2
                className='cursor-pointer'
                onClick={() => {
                  setSearch(false)
                  setInput("")
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className='w-full h-[50%] overflow-auto flex flex-col gap-[15px] mt-[20px] items-center'>
        {filteredUsers?.map(user => (
          <div
            key={user._id}
            className={`w-[95%] h-[60px] bg-white shadow-lg rounded-full flex items-center gap-[20px] px-[20px] hover:bg-[#78cae5] cursor-pointer ${selectedUser?._id === user._id ? "bg-[#78cae5]" : ""}`}
            onClick={() => dispatch(setSelectedUser(user))}
          >
            <div className='relative'>
              <div className='w-[50px] h-[50px] rounded-full overflow-hidden'>
                <img src={user.image || dp} alt="" className='h-full w-full object-cover'/>
              </div>

              {/* Online status (logic placeholder) */}
              {user.online && (
                <span className='w-[12px] h-[12px] bg-[#3aff20] rounded-full absolute bottom-[6px] right-0'></span>
              )}
            </div>

            <h1 className='text-gray-800 font-semibold text-[18px]'>
              {user.name || user.userName}
            </h1>
          </div>
        ))}
      </div>

    </div>
  )
}

export default SideBar
