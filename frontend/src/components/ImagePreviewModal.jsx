import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { RiSendPlane2Fill } from "react-icons/ri";
import { FaImages } from "react-icons/fa6";

function ImagePreviewModal({
  isOpen,
  onClose,
  imageFile,
  previewUrl,
  onSend,
  isUploading = false,
}) {
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCaption("");
    }
  }, [isOpen]);

  if (!isOpen || !previewUrl) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isUploading) return;
    onSend(caption.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-fadeIn select-none">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-[#20c7ff] flex items-center justify-center">
              <FaImages className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base">Send Image</span>
              {imageFile && (
                <span className="text-[11px] text-white/60 truncate max-w-[200px] sm:max-w-[300px]">
                  {imageFile.name} • {formatFileSize(imageFile.size)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 text-white/70 hover:text-white transition-all cursor-pointer"
            title="Cancel"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Image Preview Box */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4 bg-black/40 overflow-hidden min-h-[220px] max-h-[50vh]">
          <img
            src={previewUrl}
            alt="preview"
            className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-white/10"
          />
        </div>

        {/* Caption & Action Form */}
        <form onSubmit={handleSubmit} className="p-4 px-5 bg-white/5 border-t border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-white/15 rounded-full px-4 py-2 focus-within:border-[#20c7ff] transition-all">
            <input
              type="text"
              autoFocus
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isUploading}
              className="w-full bg-transparent outline-none text-white placeholder-white/40 text-sm sm:text-base"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#1797c2] to-[#20c7ff] hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer transition-all disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <RiSendPlane2Fill className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ImagePreviewModal;
