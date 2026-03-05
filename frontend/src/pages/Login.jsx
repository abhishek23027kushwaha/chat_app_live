import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { server_url } from "@/utils/constant";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "@/redux/userSlice";

function Login() {
  const {userData} = useSelector(store=>store.auth)
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 🔹 Backend Connect
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post(
        `${server_url}/api/auth/login`,
        formData,
        { withCredentials: true }
      );
     
      dispatch(setUserData(res.data));


      

      // 🔹 redirect after login
      navigate("/");


    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{
    if(userData) {
      navigate("/");
    }
  },[userData,navigate])

  return (
    <div className="w-full h-[100vh] bg-slate-200 flex items-center justify-center">
      <div className="w-full max-w-[500px] h-[600px] bg-white rounded-lg shadow-gray-400 shadow-lg flex flex-col gap-[30px]">

        <div className="w-full h-[200px] bg-[#20c7ff] rounded-b-[30%] shadow-gray-400 shadow-lg flex items-center justify-center">
          <h1 className="text-gray-600 font-bold text-[30px]">
            Login to <span className="text-white">chatly</span>
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-[20px] items-center"
        >
          <input
            type="email"
            name="email"
            placeholder="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-[90%] h-[50px] outline-none border-2 border-[#20c7ff] px-[20px] py-[10px] bg-white rounded-lg shadow-lg text-gray-700 text-[19px]"
          />

          <div className="w-[90%] h-[50px] border-2 border-[#20c7ff] overflow-hidden rounded-lg shadow-lg relative">
            <input
              type={show ? "text" : "password"}
              name="password"
              placeholder="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full h-full outline-none px-[20px] py-[10px] bg-white text-gray-700 text-[19px]"
            />
            <span
              className="absolute top-[10px] right-[20px] text-[19px] text-[#20c7ff] font-semibold cursor-pointer"
              onClick={() => setShow(!show)}
            >
              {show ? "hidden" : "show"}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-[20px] py-[10px] bg-[#20c7ff] rounded-2xl shadow-lg text-[20px] w-[200px] mt-[20px] font-semibold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="cursor-pointer" onClick={() => navigate("/signup")}>
            Want to create a new account ?{" "}
            <span className="text-[#20c7ff] font-bold">sign up</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
