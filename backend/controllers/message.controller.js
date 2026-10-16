import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// 🔹 1. Send Direct Message
export const sendMessage = async (req, res) => {
  try {
    const { message, audioDuration, replyTo, isForwarded } = req.body;
    const receiverId = req.params.id;
    const senderId = req.userId;

    let image = "";
    let audio = "";

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.fieldname === "image" || file.mimetype?.startsWith("image/")) {
          image = await uploadOnCloudinary(file.path);
        } else if (file.fieldname === "audio" || file.mimetype?.startsWith("audio/")) {
          audio = await uploadOnCloudinary(file.path);
        }
      }
    } else if (req.file) {
      if (req.file.fieldname === "audio" || req.file.mimetype?.startsWith("audio/")) {
        audio = await uploadOnCloudinary(req.file.path);
      } else {
        image = await uploadOnCloudinary(req.file.path);
      }
    }

    let conversation = await Conversation.findOne({
      partcipants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        partcipants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      message: message || "",
      image: image || "",
      audio: audio || "",
      audioDuration: Number(audioDuration) || 0,
      replyTo: replyTo || null,
      isForwarded: Boolean(isForwarded),
    });

    conversation.messages.push(newMessage._id);
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name userName image")
      .populate({
        path: "replyTo",
        select: "message image audio sender",
        populate: { path: "sender", select: "name userName image" },
      })
      .populate("reactions.user", "name userName image");

    // Real-time message delivery via Socket.IO
    const receiverSocketIds = getReceiverSocketId(receiverId);
    if (receiverSocketIds && receiverSocketIds.length > 0) {
      receiverSocketIds.forEach((sId) => {
        io.to(sId).emit("newMessage", populatedMessage);
      });
    }

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 2. Get Messages with Full Population
export const getMessages = async (req, res) => {
  try {
    const userToChatId = req.params.id;
    const senderId = req.userId;

    const conversation = await Conversation.findOne({
      partcipants: { $all: [senderId, userToChatId] },
    }).populate({
      path: "messages",
      populate: [
        { path: "sender", select: "name userName image" },
        {
          path: "replyTo",
          select: "message image audio sender",
          populate: { path: "sender", select: "name userName image" },
        },
        { path: "reactions.user", select: "name userName image" },
      ],
    });

    if (!conversation) return res.status(200).json([]);
    return res.status(200).json(conversation.messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 3. Edit Message
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { newContent } = req.body;
    const userId = req.userId;

    if (!newContent || !newContent.trim()) {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (String(message.sender) !== String(userId)) {
      return res.status(403).json({ error: "Unauthorized to edit this message" });
    }

    if (message.isDeleted) {
      return res.status(400).json({ error: "Deleted message cannot be edited" });
    }

    message.message = newContent.trim();
    message.isEdited = true;
    await message.save();

    const populated = await Message.findById(id)
      .populate("sender", "name userName image")
      .populate({
        path: "replyTo",
        select: "message image audio sender",
        populate: { path: "sender", select: "name userName image" },
      })
      .populate("reactions.user", "name userName image");

    // Real-time notification
    if (message.groupId) {
      io.emit("messageEdited", { message: populated, groupId: message.groupId });
    } else {
      const targetSockets = [
        ...getReceiverSocketId(message.receiver),
        ...getReceiverSocketId(message.sender),
      ];
      targetSockets.forEach((sId) => io.to(sId).emit("messageEdited", { message: populated }));
    }

    return res.status(200).json(populated);
  } catch (error) {
    console.log("Error in editMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 4. Delete Message (For Everyone)
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (String(message.sender) !== String(userId)) {
      return res.status(403).json({ error: "Unauthorized to delete this message" });
    }

    message.isDeleted = true;
    message.message = "This message was deleted";
    message.image = "";
    message.audio = "";
    message.audioDuration = 0;
    message.reactions = [];
    await message.save();

    // Real-time notification
    if (message.groupId) {
      io.emit("messageDeleted", { messageId: id, groupId: message.groupId });
    } else {
      const targetSockets = [
        ...getReceiverSocketId(message.receiver),
        ...getReceiverSocketId(message.sender),
      ];
      targetSockets.forEach((sId) => io.to(sId).emit("messageDeleted", { messageId: id }));
    }

    return res.status(200).json({ message: "Message deleted successfully", messageId: id });
  } catch (error) {
    console.log("Error in deleteMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 5. Emoji Reaction (Add / Toggle)
export const reactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.userId;

    if (!emoji) return res.status(400).json({ error: "Emoji is required" });

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.isDeleted) {
      return res.status(400).json({ error: "Cannot react to deleted message" });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => String(r.user) === String(userId)
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Toggle off if same emoji clicked again
        message.reactions.splice(existingIndex, 1);
      } else {
        // Update to new emoji
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    const populated = await Message.findById(id)
      .populate("reactions.user", "name userName image");

    const payload = {
      messageId: id,
      reactions: populated.reactions,
      groupId: message.groupId,
      receiverId: message.receiver,
    };

    if (message.groupId) {
      io.emit("messageReaction", payload);
    } else {
      const targetSockets = [
        ...getReceiverSocketId(message.receiver),
        ...getReceiverSocketId(message.sender),
      ];
      targetSockets.forEach((sId) => io.to(sId).emit("messageReaction", payload));
    }

    return res.status(200).json(populated.reactions);
  } catch (error) {
    console.log("Error in reactMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 6. Forward Message
export const forwardMessage = async (req, res) => {
  try {
    const { messageId, destinationUserIds = [], destinationGroupIds = [] } = req.body;
    const senderId = req.userId;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ error: "Original message not found" });
    }

    if (originalMessage.isDeleted) {
      return res.status(400).json({ error: "Cannot forward deleted message" });
    }

    const createdMessages = [];

    // Forward to Direct Users
    for (const destUserId of destinationUserIds) {
      let conversation = await Conversation.findOne({
        partcipants: { $all: [senderId, destUserId] },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          partcipants: [senderId, destUserId],
        });
      }

      const fwdMsg = await Message.create({
        sender: senderId,
        receiver: destUserId,
        message: originalMessage.message,
        image: originalMessage.image,
        audio: originalMessage.audio,
        audioDuration: originalMessage.audioDuration,
        isForwarded: true,
      });

      conversation.messages.push(fwdMsg._id);
      await conversation.save();

      const populated = await Message.findById(fwdMsg._id)
        .populate("sender", "name userName image");

      createdMessages.push(populated);

      const sIds = getReceiverSocketId(destUserId);
      sIds.forEach((sId) => io.to(sId).emit("newMessage", populated));
    }

    // Forward to Groups
    for (const destGroupId of destinationGroupIds) {
      const group = await Group.findById(destGroupId);
      if (group && group.members.some((m) => String(m) === String(senderId))) {
        const fwdMsg = await Message.create({
          sender: senderId,
          groupId: destGroupId,
          message: originalMessage.message,
          image: originalMessage.image,
          audio: originalMessage.audio,
          audioDuration: originalMessage.audioDuration,
          isForwarded: true,
        });

        group.messages.push(fwdMsg._id);
        await group.save();

        const populated = await Message.findById(fwdMsg._id)
          .populate("sender", "name userName image");

        createdMessages.push(populated);

        group.members.forEach((mId) => {
          const sIds = getReceiverSocketId(mId);
          sIds.forEach((sId) =>
            io.to(sId).emit("newGroupMessage", {
              groupId: destGroupId,
              message: populated,
            })
          );
        });
      }
    }

    return res.status(201).json({ success: true, forwardedCount: createdMessages.length });
  } catch (error) {
    console.log("Error in forwardMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 7. Search Messages with Pagination
export const searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q, page = 1, limit = 50 } = req.query;
    const userId = req.userId;

    if (!q || !q.trim()) {
      return res.status(200).json({ results: [], total: 0, page: 1, totalPages: 0 });
    }

    const regex = new RegExp(q.trim(), "i");

    const group = await Group.findById(chatId);
    let query = {};

    if (group) {
      query = {
        groupId: chatId,
        message: { $regex: regex },
        isDeleted: false,
      };
    } else {
      query = {
        $or: [
          { sender: userId, receiver: chatId },
          { sender: chatId, receiver: userId },
        ],
        message: { $regex: regex },
        isDeleted: false,
      };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 50);
    const skip = (pageNum - 1) * limitNum;

    const total = await Message.countDocuments(query);
    const results = await Message.find(query)
      .populate("sender", "name userName image")
      .populate({
        path: "replyTo",
        select: "message image audio sender",
        populate: { path: "sender", select: "name userName image" },
      })
      .populate("reactions.user", "name userName image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      results: results.reverse(),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.log("Error in searchMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
