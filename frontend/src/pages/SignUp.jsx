import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { server_url } from "@/utils/constant";
import { useSelector } from "react-redux";

function SignUp() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { userData } = useSelector((store) => store.auth);
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedUser = formData.userName.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedUser || !trimmedEmail || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${server_url}/api/auth/signup`,
        {
          userName: trimmedUser,
          email: trimmedEmail,
          password: formData.password,
        },
        { withCredentials: true }
      );

      console.log("Signup success:", res.data);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            email: trimmedEmail, 
            message: "Account created successfully! Please enter your password to login." 
          } 
        });
      }, 1000);
    } catch (err) {
      console.error("Signup error:", err);
      const message = err.response?.data?.message || err.message || "Signup failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Already logged in user redirect
  useEffect(() => {
    if (userData) {
      navigate("/");
    }
  }, [userData, navigate]);

  return (
    <div className="w-full min-h-screen bg-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">

        {/* Header Banner */}
        <div className="w-full py-10 bg-[#20c7ff] rounded-b-[40px] shadow-md flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-white font-extrabold text-[32px] tracking-wide">
            Welcome to <span className="text-gray-800">chatly</span>
          </h1>
          <p className="text-white/90 text-sm mt-1">Create your account to start chatting</p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 flex flex-col items-center">
          {error && (
            <div className="w-full mb-4 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg text-center font-medium animate-fadeIn">
              {error}
            </div>
          )}

          {success && (
            <div className="w-full mb-4 p-3 bg-green-100 border border-green-300 text-green-700 text-sm rounded-lg text-center font-medium animate-fadeIn">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 items-center">
            <div className="w-full flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600 pl-1">Username</label>
              <input
                type="text"
                name="userName"
                placeholder="e.g. johndoe"
                value={formData.userName}
                onChange={handleChange}
                required
                className="w-full h-[48px] outline-none border-2 border-gray-200 focus:border-[#20c7ff] px-4 rounded-xl text-gray-700 text-[16px] transition-all"
              />
            </div>

            <div className="w-full flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600 pl-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="e.g. john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full h-[48px] outline-none border-2 border-gray-200 focus:border-[#20c7ff] px-4 rounded-xl text-gray-700 text-[16px] transition-all"
              />
            </div>

            <div className="w-full flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600 pl-1">Password</label>
              <div className="w-full h-[48px] border-2 border-gray-200 focus-within:border-[#20c7ff] rounded-xl relative flex items-center transition-all">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full h-full outline-none px-4 pr-16 bg-transparent text-gray-700 text-[16px]"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 text-xs text-[#20c7ff] font-bold hover:underline cursor-pointer select-none"
                  onClick={() => setShow(!show)}
                >
                  {show ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 bg-[#20c7ff] hover:bg-[#12bbf2] text-white font-bold rounded-xl shadow-md text-lg cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <p className="mt-3 text-sm text-gray-600">
              Already have an account?{" "}
              <span
                className="text-[#20c7ff] font-bold cursor-pointer hover:underline"
                onClick={() => navigate("/login")}
              >
                Login
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;

