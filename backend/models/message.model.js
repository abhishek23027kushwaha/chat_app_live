import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    message: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    audio: {
      type: String,
      default: "",
    },
    audioDuration: {
      type: Number,
      default: 0,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for high performance queries and search
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ groupId: 1, createdAt: 1 });
messageSchema.index({ message: "text" });

const Message = mongoose.model("Message", messageSchema);
export default Message;