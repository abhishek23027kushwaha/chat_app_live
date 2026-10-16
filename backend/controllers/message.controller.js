import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const { message, audioDuration } = req.body;
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

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message: message || "",
            image: image || "",
            audio: audio || "",
            audioDuration: Number(audioDuration) || 0,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        await Promise.all([conversation.save(), newMessage.save()]);

        // Real-time message delivery via Socket.IO
        const receiverSocketIds = getReceiverSocketId(receiverId);
        if (receiverSocketIds && receiverSocketIds.length > 0) {
            receiverSocketIds.forEach((sId) => {
                io.to(sId).emit("newMessage", newMessage);
            });
        }

        return res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const userToChatId = req.params.id;
        const senderId = req.userId;

        const conversation = await Conversation.findOne({
            partcipants: { $all: [senderId, userToChatId] },
        }).populate("messages");

        if (!conversation) return res.status(200).json([]);

        const messages = conversation.messages;

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
