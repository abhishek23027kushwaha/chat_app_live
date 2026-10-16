import jwt from "jsonwebtoken";

const genToken = async (userId) => {
  try {
    const secret = process.env.JWT_SECRET || "chat_app_jwt_secret_key_12345";
    const token = jwt.sign({ userId }, secret, { expiresIn: "7d" });
    return token;
  } catch (error) {
    console.error("gen token error:", error);
    throw error;
  }
};

export default genToken;