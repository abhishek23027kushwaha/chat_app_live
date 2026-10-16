import React, { useRef, useState } from "react";
import dp from "../assets/dp.webp";
import { IoCameraOutline } from "react-icons/io5";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { server_url } from "@/utils/constant";

function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
   const {userData} = useSelector(store=>store.auth);
  // 🔹 Dummy user data (UI only)
  const [name, setName] = useState(userData.name || "");
  const [frontendImage, setFrontendImage] = useState(userData.image || dp);
  const [backendImage,setBackendImage] =useState(null)
  const imageRef = useRef();
  const [saving, setSaving] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    if (file) {
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  const handleProfile = async (e) => {
    e.preventDefault();
    let formData = new FormData();
    formData.append("name", name);
    if (backendImage) {
      formData.append("image", backendImage);
    }
    setSaving(true);
    try {
      const res = await axios.put(`${server_url}/api/user/profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      if (res.data.success) {
        dispatch(setUserData(res.data.user));
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-[100vh] bg-slate-200 flex flex-col justify-center items-center gap-[20px]">
      
      {/* Back Button */}
      <div
        className="fixed top-[20px] left-[20px] cursor-pointer"
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack className="w-[50px] h-[50px] text-gray-600" />
      </div>

      {/* Profile Image */}
      <div
        className="bg-white rounded-full border-4 border-[#20c7ff] shadow-lg relative cursor-pointer"
        onClick={() => imageRef.current.click()}
      >
        <div className="w-[200px] h-[200px] rounded-full overflow-hidden flex justify-center items-center">
          <img src={frontendImage} alt="profile" className="h-full w-full object-cover" />
        </div>

        <div className="absolute bottom-4 right-4 w-[35px] h-[35px] rounded-full bg-[#20c7ff] flex justify-center items-center shadow-lg">
          <IoCameraOutline className="w-[25px] h-[25px] text-gray-700" />
        </div>
      </div>

      {/* Profile Form */}
      <form
        className="w-[95%] max-w-[500px] flex flex-col gap-[20px] items-center"
        onSubmit={handleProfile}
      >
        <input
          type="file"
          accept="image/*"
          hidden
          ref={imageRef}
          onChange={handleImage}
        />

        <input
          type="text"
          placeholder="Enter your name"
          className="w-[90%] h-[50px] outline-none border-2 border-[#20c7ff] px-[20px] rounded-lg shadow-lg text-gray-700 text-[19px]"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          readOnly
          value={userData?.userName || ""}
          className="w-[90%] h-[50px] border-2 border-[#20c7ff] px-[20px] rounded-lg shadow-lg text-gray-500 text-[19px] bg-gray-50 cursor-not-allowed"
        />

        <input
          type="email"
          readOnly
          value={userData?.email || ""}
          className="w-[90%] h-[50px] border-2 border-[#20c7ff] px-[20px] rounded-lg shadow-lg text-gray-500 text-[19px] bg-gray-50 cursor-not-allowed"
        />

        <button
          disabled={saving}
          className="px-[20px] py-[10px] bg-[#20c7ff] hover:bg-[#12bbf2] text-white rounded-2xl shadow-lg text-[20px] w-[200px] mt-[20px] font-semibold cursor-pointer transition-all disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

export default Profile;
