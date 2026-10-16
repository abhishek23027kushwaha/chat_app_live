import React, { useEffect, useState } from "react";
import { IoClose, IoDownloadOutline } from "react-icons/io5";
import { formatMessageTime } from "../utils/dateUtils";

function ImageViewerModal({ isOpen, onClose, imageData }) {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageData?.url) return null;

  const { url, caption, senderName, createdAt } = imageData;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const extension = blob.type.split("/")[1] || "jpg";
      link.download = `chat_image_${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback
      window.open(url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="w-full max-w-5xl flex items-center justify-between text-white py-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          {senderName && (
            <span className="font-semibold text-base sm:text-lg text-white">
              {senderName}
            </span>
          )}
          {createdAt && (
            <span className="text-xs text-white/70">
              {formatMessageTime(createdAt)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Download full image"
          >
            <IoDownloadOutline className="w-5 h-5" />
            <span className="hidden sm:inline">
              {isDownloading ? "Downloading..." : "Download"}
            </span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Center Image Container */}
      <div
        className="flex-1 flex items-center justify-center p-2 sm:p-6 w-full max-w-5xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={caption || "Full screen view"}
          className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform hover:scale-[1.01]"
        />
      </div>

      {/* Bottom Caption Bar */}
      {caption && (
        <div
          className="w-full max-w-2xl bg-white/10 backdrop-blur-md text-white text-center text-sm sm:text-base px-6 py-3 rounded-2xl mb-2 z-10 shadow-lg border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

export default ImageViewerModal;
