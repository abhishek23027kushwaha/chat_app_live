import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required. Please log in." });
    }

    const secret = process.env.JWT_SECRET || "chat_app_jwt_secret_key_12345";
    const verifyToken = jwt.verify(token, secret);
    req.userId = verifyToken.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};

export default isAuth;