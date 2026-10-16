import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// 🔹 1. Create Group
export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    let members = req.body.members;
    const adminId = req.userId;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Parse members if passed as stringified JSON or comma-separated string
    let parsedMembers = [];
    if (typeof members === "string") {
      try {
        parsedMembers = JSON.parse(members);
      } catch (err) {
        parsedMembers = members.split(",").map((m) => m.trim());
      }
    } else if (Array.isArray(members)) {
      parsedMembers = members;
    }

    // Ensure admin is in members and unique
    const uniqueMembers = Array.from(new Set([adminId, ...parsedMembers.map(String)]));

    let profileImage = "";
    if (req.file) {
      profileImage = await uploadOnCloudinary(req.file.path);
    }

    const newGroup = await Group.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      profileImage: profileImage || "",
      admin: adminId,
      members: uniqueMembers,
    });

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("admin", "name userName image email")
      .populate("members", "name userName image email");

    // Real-time notification to all members
    uniqueMembers.forEach((memberId) => {
      const sIds = getReceiverSocketId(memberId);
      sIds.forEach((sId) => {
        io.to(sId).emit("newGroupAdded", populatedGroup);
      });
    });

    return res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 2. Get User's Groups
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.userId;
    const groups = await Group.find({ members: userId })
      .populate("admin", "name userName image email")
      .populate("members", "name userName image email")
      .sort({ updatedAt: -1 });

    return res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 3. Get Group By ID
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    const group = await Group.findById(groupId)
      .populate("admin", "name userName image email")
      .populate("members", "name userName image email");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => String(m._id) === String(userId));
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    return res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupById controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 4. Add Members (Admin Only)
export const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check admin authorization
    if (String(group.admin) !== String(userId)) {
      return res.status(403).json({ message: "Only group admin can add members" });
    }

    let parsedMembers = [];
    if (typeof members === "string") {
      try {
        parsedMembers = JSON.parse(members);
      } catch (err) {
        parsedMembers = members.split(",").map((m) => m.trim());
      }
    } else if (Array.isArray(members)) {
      parsedMembers = members;
    }

    const currentMemberIds = group.members.map((m) => String(m));
    const newMembersToAdd = parsedMembers
      .map(String)
      .filter((m) => !currentMemberIds.includes(m));

    if (newMembersToAdd.length === 0) {
      return res.status(400).json({ message: "Selected user(s) are already in the group" });
    }

    group.members.push(...newMembersToAdd);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "name userName image email")
      .populate("members", "name userName image email");

    // Real-time notification:
    // 1. Tell existing and new members the group is updated
    updatedGroup.members.forEach((m) => {
      const sIds = getReceiverSocketId(m._id);
      sIds.forEach((sId) => {
        io.to(sId).emit("groupUpdated", updatedGroup);
      });
    });

    // 2. For newly added members, emit newGroupAdded so it appears in their sidebar immediately
    newMembersToAdd.forEach((newMemId) => {
      const sIds = getReceiverSocketId(newMemId);
      sIds.forEach((sId) => {
        io.to(sId).emit("newGroupAdded", updatedGroup);
      });
    });

    return res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in addMembers controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 5. Remove Member (Admin Only)
export const removeMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check admin authorization
    if (String(group.admin) !== String(userId)) {
      return res.status(403).json({ message: "Only group admin can remove members" });
    }

    if (String(memberId) === String(userId)) {
      return res.status(400).json({ message: "Admin cannot remove themselves. Use leave group instead." });
    }

    const initialCount = group.members.length;
    group.members = group.members.filter((m) => String(m) !== String(memberId));

    if (group.members.length === initialCount) {
      return res.status(404).json({ message: "Member not found in this group" });
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "name userName image email")
      .populate("members", "name userName image email");

    // Real-time notifications:
    // 1. Notify remaining members
    updatedGroup.members.forEach((m) => {
      const sIds = getReceiverSocketId(m._id);
      sIds.forEach((sId) => {
        io.to(sId).emit("groupUpdated", updatedGroup);
      });
    });

    // 2. Notify removed member
    const removedSocketIds = getReceiverSocketId(memberId);
    removedSocketIds.forEach((sId) => {
      io.to(sId).emit("removedFromGroup", { groupId });
    });

    return res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in removeMember controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 6. Leave Group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => String(m) === String(userId));
    if (!isMember) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    // Filter out the leaving user
    const remainingMembers = group.members.filter((m) => String(m) !== String(userId));

    // If leaving user is admin
    if (String(group.admin) === String(userId)) {
      if (remainingMembers.length > 0) {
        // Automatically promote the first remaining member to admin
        group.admin = remainingMembers[0];
        group.members = remainingMembers;
        await group.save();

        const updatedGroup = await Group.findById(groupId)
          .populate("admin", "name userName image email")
          .populate("members", "name userName image email");

        // Notify remaining members
        updatedGroup.members.forEach((m) => {
          const sIds = getReceiverSocketId(m._id);
          sIds.forEach((sId) => {
            io.to(sId).emit("groupUpdated", updatedGroup);
          });
        });

        // Notify leaving user
        const leavingSockets = getReceiverSocketId(userId);
        leavingSockets.forEach((sId) => {
          io.to(sId).emit("removedFromGroup", { groupId });
        });

        return res.status(200).json({ message: "Left group successfully", group: updatedGroup });
      } else {
        // No members left: Delete group
        await Group.findByIdAndDelete(groupId);

        const leavingSockets = getReceiverSocketId(userId);
        leavingSockets.forEach((sId) => {
          io.to(sId).emit("removedFromGroup", { groupId });
        });

        return res.status(200).json({ message: "Group deleted as all members left", groupId });
      }
    } else {
      // Normal member leaving
      group.members = remainingMembers;
      await group.save();

      const updatedGroup = await Group.findById(groupId)
        .populate("admin", "name userName image email")
        .populate("members", "name userName image email");

      // Notify remaining members
      updatedGroup.members.forEach((m) => {
        const sIds = getReceiverSocketId(m._id);
        sIds.forEach((sId) => {
          io.to(sId).emit("groupUpdated", updatedGroup);
        });
      });

      // Notify leaving user
      const leavingSockets = getReceiverSocketId(userId);
      leavingSockets.forEach((sId) => {
        io.to(sId).emit("removedFromGroup", { groupId });
      });

      return res.status(200).json({ message: "Left group successfully", group: updatedGroup });
    }
  } catch (error) {
    console.error("Error in leaveGroup controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 7. Send Group Message
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;
    const senderId = req.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => String(m) === String(senderId));
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    let image = "";
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }

    const newMessage = await Message.create({
      sender: senderId,
      groupId: groupId,
      message: message || "",
      image: image || "",
    });

    group.messages.push(newMessage._id);
    await group.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "sender",
      "name userName image"
    );

    // Broadcast message to all group members
    group.members.forEach((memberId) => {
      const sIds = getReceiverSocketId(memberId);
      sIds.forEach((sId) => {
        io.to(sId).emit("newGroupMessage", {
          groupId,
          message: populatedMessage,
        });
      });
    });

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 8. Get Group Messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => String(m) === String(userId));
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupId })
      .populate("sender", "name userName image")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
