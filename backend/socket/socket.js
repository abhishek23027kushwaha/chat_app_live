import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://chat-app-live-1-0u5q.onrender.com",
  "https://chat-app-live-38ys.onrender.com"
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Map of userId to Set of socketIds (supports reconnects, multiple tabs, and transport upgrades)
const userSocketMap = {}; // { userId: Set<socketId> }
// Map of active ongoing calls { userId: partnerUserId }
const activeCalls = {};

export const getReceiverSocketId = (receiverId) => {
  if (!receiverId) return [];
  const idStr = String(receiverId).trim();
  if (userSocketMap[idStr] && userSocketMap[idStr].size > 0) {
    return Array.from(userSocketMap[idStr]);
  }
  return [];
};

// Helper: Deliver pending offline messages when user comes online
const deliverPendingMessages = async (uid) => {
  try {
    const pending = await Message.find({ receiver: uid, status: "sent" }).select("_id sender");
    if (pending && pending.length > 0) {
      await Message.updateMany(
        { receiver: uid, status: "sent" },
        { status: "delivered", deliveredAt: new Date() }
      );

      const senderGroup = {};
      pending.forEach((m) => {
        const s = String(m.sender);
        if (!senderGroup[s]) senderGroup[s] = [];
        senderGroup[s].push(String(m._id));
      });

      Object.entries(senderGroup).forEach(([sId, messageIds]) => {
        const senderSockets = getReceiverSocketId(sId);
        senderSockets.forEach((sockId) => {
          io.to(sockId).emit("messagesDelivered", { messageIds, status: "delivered" });
        });
      });
    }
  } catch (e) {
    console.log("Error delivering pending messages:", e);
  }
};

io.on("connection", (socket) => {
  const rawUserId = socket.handshake.query.userId;
  const userId = rawUserId && rawUserId !== "undefined" && rawUserId !== "null" 
    ? String(rawUserId).trim() 
    : null;

  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = new Set();
    }
    userSocketMap[userId].add(socket.id);
    console.log(`User connected: ${userId} (active sockets: ${userSocketMap[userId].size})`);
    
    // Automatically deliver any pending messages when user connects
    deliverPendingMessages(userId);
  }

  // Broadcast all currently online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // 🔹 Message Delivered Event (Receiver device confirmed receipt)
  socket.on("message_delivered", async ({ messageId, senderId }) => {
    try {
      if (!messageId) return;
      await Message.findByIdAndUpdate(messageId, {
        status: "delivered",
        deliveredAt: new Date(),
      });
      if (senderId) {
        const senderSockets = getReceiverSocketId(senderId);
        senderSockets.forEach((sId) => {
          io.to(sId).emit("messageDelivered", { messageId, status: "delivered" });
        });
      }
    } catch (e) {
      console.log("Error in message_delivered:", e);
    }
  });

  // 🔹 Message Read Event (Receiver opened chat and read messages)
  socket.on("mark_read", async ({ senderId }) => {
    try {
      if (!userId || !senderId) return;
      await Message.updateMany(
        {
          sender: senderId,
          receiver: userId,
          status: { $ne: "read" },
        },
        { status: "read", readAt: new Date() }
      );

      const senderSockets = getReceiverSocketId(senderId);
      senderSockets.forEach((sId) => {
        io.to(sId).emit("messagesRead", { readerId: userId });
      });
    } catch (e) {
      console.log("Error in mark_read socket event:", e);
    }
  });

  // Typing event
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketIds = getReceiverSocketId(receiverId);
    receiverSocketIds.forEach((sId) => {
      io.to(sId).emit("typing", { senderId: userId });
    });
  });

  // Stop typing event
  socket.on("stop_typing", ({ receiverId }) => {
    const receiverSocketIds = getReceiverSocketId(receiverId);
    receiverSocketIds.forEach((sId) => {
      io.to(sId).emit("stop_typing", { senderId: userId });
    });
  });

  // Group room events
  socket.on("join_group", (groupId) => {
    if (groupId) {
      socket.join(String(groupId));
    }
  });

  socket.on("leave_group", (groupId) => {
    if (groupId) {
      socket.leave(String(groupId));
    }
  });

  // Group typing events
  socket.on("group_typing", ({ groupId, userName }) => {
    if (groupId) {
      socket.to(String(groupId)).emit("group_typing", { groupId, userName, senderId: userId });
    }
  });

  socket.on("group_stop_typing", ({ groupId }) => {
    if (groupId) {
      socket.to(String(groupId)).emit("group_stop_typing", { groupId, senderId: userId });
    }
  });

  // ============================================
  // 🎥 WebRTC 1-to-1 Video / Audio Call Handlers
  // ============================================
  socket.on("call:start", ({ recipientId, callType, callerName, callerImage }) => {
    if (!userId) {
      return socket.emit("call:failed", { message: "Authentication required to make calls." });
    }
    if (!recipientId || String(recipientId) === String(userId)) {
      return socket.emit("call:failed", { message: "Invalid call recipient." });
    }

    const recipientSockets = getReceiverSocketId(recipientId);
    if (!recipientSockets || recipientSockets.length === 0) {
      return socket.emit("call:failed", { message: "User is currently offline." });
    }

    if (activeCalls[recipientId]) {
      return socket.emit("call:failed", { message: "User is busy on another call." });
    }

    if (activeCalls[userId]) {
      return socket.emit("call:failed", { message: "You are already in an active call." });
    }

    // Mark active call session
    activeCalls[userId] = String(recipientId);
    activeCalls[String(recipientId)] = String(userId);

    // Notify recipient devices of incoming call
    recipientSockets.forEach((sId) => {
      io.to(sId).emit("call:incoming", {
        callerId: userId,
        callerName: callerName || "Unknown",
        callerImage: callerImage || "",
        callType: callType || "video",
      });
    });

    // Notify caller that call is ringing
    socket.emit("call:ringing", { recipientId });
  });

  socket.on("call:accept", ({ callerId }) => {
    if (!callerId) return;
    const callerSockets = getReceiverSocketId(callerId);
    callerSockets.forEach((sId) => {
      io.to(sId).emit("call:accepted", { recipientId: userId });
    });
  });

  socket.on("call:reject", ({ callerId, reason }) => {
    if (!callerId) return;
    delete activeCalls[String(userId)];
    delete activeCalls[String(callerId)];

    const callerSockets = getReceiverSocketId(callerId);
    callerSockets.forEach((sId) => {
      io.to(sId).emit("call:rejected", {
        recipientId: userId,
        reason: reason || "declined",
      });
    });
  });

  socket.on("call:end", ({ targetId }) => {
    if (targetId) {
      delete activeCalls[String(userId)];
      delete activeCalls[String(targetId)];

      const targetSockets = getReceiverSocketId(targetId);
      targetSockets.forEach((sId) => {
        io.to(sId).emit("call:ended", { from: userId });
      });
    }
  });

  socket.on("webrtc:signal", ({ targetId, signalData }) => {
    if (!targetId || !signalData) return;
    const targetSockets = getReceiverSocketId(targetId);
    targetSockets.forEach((sId) => {
      io.to(sId).emit("webrtc:signal", {
        senderId: userId,
        signalData,
      });
    });
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    if (userId) {
      // If user was in an active call, notify the other party
      const partnerId = activeCalls[userId];
      if (partnerId) {
        delete activeCalls[userId];
        delete activeCalls[partnerId];
        const partnerSockets = getReceiverSocketId(partnerId);
        partnerSockets.forEach((sId) => {
          io.to(sId).emit("call:ended", {
            from: userId,
            reason: "User disconnected",
          });
        });
      }

      if (userSocketMap[userId]) {
        userSocketMap[userId].delete(socket.id);
        if (userSocketMap[userId].size === 0) {
          delete userSocketMap[userId];
          console.log(`User completely offline: ${userId}`);
        } else {
          console.log(`User ${userId} closed a socket, still has ${userSocketMap[userId].size} active`);
        }
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
