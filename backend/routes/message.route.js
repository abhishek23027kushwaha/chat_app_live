import express from "express";
import { getMessages, sendMessage } from "../controllers/message.controller.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const messageRouter = express.Router();

messageRouter.get("/:id", isAuth, getMessages);
messageRouter.post("/send/:id", isAuth, upload.single("image"), sendMessage);

export default messageRouter;
