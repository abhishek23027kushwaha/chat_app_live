import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import messageRouter from "./routes/message.route.js";
import path from "path"

dotenv.config();
connectDB();

const app = express();
const _dirname = path.resolve();
app.use(cors({
  origin: ["http://localhost:5173", "https://chat-app-live-1-0u5q.onrender.com"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});
app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/message",messageRouter);

app.use(express.static(path.join(_dirname, "/frontend/dist")));

// ✅ CATCH-ALL HANDLER (NO path-to-regexp parsing)
app.use((req, res) => {
  res.sendFile(
    path.resolve(_dirname, "frontend", "dist", "index.html")
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT} 🔥`)
);
