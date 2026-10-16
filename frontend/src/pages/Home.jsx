import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import SideBar from "@/components/SideBar";
import MessageArea from "@/components/MessageArea";

function Home() {
  const { userData } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      navigate("/login");
    }
  }, [userData, navigate]);

  if (!userData) return null;

  return (
    <div className="w-full h-[100dvh] h-screen flex overflow-hidden bg-slate-100">
      <SideBar />
      <MessageArea />
    </div>
  );
}

export default Home;

