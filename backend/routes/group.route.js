import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import {
  createGroup,
  getMyGroups,
  getGroupById,
  addMembers,
  removeMember,
  leaveGroup,
  sendGroupMessage,
  getGroupMessages,
} from "../controllers/group.controller.js";

const groupRouter = express.Router();

// Group management routes
groupRouter.post("/create", isAuth, upload.single("image"), createGroup);
groupRouter.get("/my-groups", isAuth, getMyGroups);
groupRouter.get("/:groupId", isAuth, getGroupById);
groupRouter.put("/add-members/:groupId", isAuth, addMembers);
groupRouter.put("/remove-member/:groupId", isAuth, removeMember);
groupRouter.put("/leave/:groupId", isAuth, leaveGroup);

// Group messaging routes
groupRouter.post("/send/:groupId", isAuth, upload.any(), sendGroupMessage);
groupRouter.get("/messages/:groupId", isAuth, getGroupMessages);

export default groupRouter;
