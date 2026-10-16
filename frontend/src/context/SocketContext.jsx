import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import { server_url } from "@/utils/constant";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { userData } = useSelector((store) => store.auth);

  useEffect(() => {
    if (userData?._id) {
      const userIdStr = String(userData._id).trim();

      const newSocket = io(server_url, {
        query: {
          userId: userIdStr,
        },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected with ID:", newSocket.id);
      });

      newSocket.on("getOnlineUsers", (users) => {
        const stringifiedUsers = Array.isArray(users) 
          ? users.map((u) => String(u).trim()) 
          : [];
        setOnlineUsers(stringifiedUsers);
      });

      newSocket.on("connect_error", (err) => {
        console.warn("Socket connect error:", err.message);
      });

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setOnlineUsers([]);
    }
  }, [userData?._id ? String(userData._id) : null]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
