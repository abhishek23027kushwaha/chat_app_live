import multer from "multer";
import fs from "fs";
import path from "path";

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), "public");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".png");
    const base = path.basename(file.originalname || "file", ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

export const upload = multer({ storage });