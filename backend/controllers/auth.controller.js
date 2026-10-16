import genToken from "../config/token.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  };
};

export const signUp = async (req, res) => {
  try {
    const { userName, email, password, name } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const trimmedUserName = userName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const checkUserByUserName = await User.findOne({ 
      userName: { $regex: new RegExp(`^${trimmedUserName}$`, "i") } 
    });
    if (checkUserByUserName) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const checkUserByEmail = await User.findOne({ email: trimmedEmail });
    if (checkUserByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name?.trim() || trimmedUserName,
      userName: trimmedUserName,
      email: trimmedEmail,
      password: hashedPassword,
    });

    const token = await genToken(user._id);

    res.cookie("token", token, getCookieOptions());

    const userResponse = {
      _id: user._id,
      name: user.name,
      userName: user.userName,
      email: user.email,
      image: user.image || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(201).json(userResponse);
  } catch (error) {
    console.error("SignUp error:", error);
    return res.status(500).json({ message: `Signup error: ${error.message}` });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const trimmedInput = email.trim().toLowerCase();

    // Allow login with either email or username
    const user = await User.findOne({
      $or: [
        { email: trimmedInput },
        { userName: { $regex: new RegExp(`^${trimmedInput}$`, "i") } }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = await genToken(user._id);

    res.cookie("token", token, getCookieOptions());

    const userResponse = {
      _id: user._id,
      name: user.name,
      userName: user.userName,
      email: user.email,
      image: user.image || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json(userResponse);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: `Login error: ${error.message}` });
  }
};

export const logOut = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: `Logout error: ${error.message}` });
  }
};