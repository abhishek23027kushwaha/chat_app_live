import express from "express";
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  reactMessage,
  forwardMessage,
  searchMessages,
  markMessagesAsRead,
} from "../controllers/message.controller.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const messageRouter = express.Router();

messageRouter.get("/search/:chatId", isAuth, searchMessages);
messageRouter.post("/forward", isAuth, forwardMessage);
messageRouter.put("/edit/:id", isAuth, editMessage);
messageRouter.delete("/delete/:id", isAuth, deleteMessage);
messageRouter.post("/react/:id", isAuth, reactMessage);
messageRouter.put("/read/:senderId", isAuth, markMessagesAsRead);
messageRouter.get("/:id", isAuth, getMessages);
messageRouter.post("/send/:id", isAuth, upload.any(), sendMessage);

export default messageRouter;
