import React from "react";
import { RxCross2 } from "react-icons/rx";
import { FaMicrophone } from "react-icons/fa6";
import { IoLockClosed } from "react-icons/io5";

function MicPermissionModal({ isOpen, onClose, onTryAgain, errorType = "denied" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1797c2] to-[#20c7ff] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <FaMicrophone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Microphone Permission</h3>
              <p className="text-xs text-white/90">Voice message bhejne ke liye mic allow karein</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-all"
          >
            <RxCross2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-gray-700 text-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <IoLockClosed className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold text-sm text-amber-900">Browser me Mic Blocked Hai</p>
              <p>Aapke browser ne is website ke liye microphone permission block kar di hai.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
              Microphone kaise on karein:
            </h4>

            {/* Step 1 */}
            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-gray-100">
              <span className="w-6 h-6 rounded-full bg-[#1797c2] text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </span>
              <p className="text-xs text-gray-600">
                Browser ke URL bar me upar <b>🔒 Lock (ya tune/settings)</b> icon par click karein.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-gray-100">
              <span className="w-6 h-6 rounded-full bg-[#1797c2] text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </span>
              <p className="text-xs text-gray-600">
                <b>Microphone</b> setting ko <b>"Block"</b> se badal kar <b>"Allow"</b> karein.
              </p>
            </div>

            {/* Step 3 (Mac Note) */}
            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-gray-100">
              <span className="w-6 h-6 rounded-full bg-[#1797c2] text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </span>
              <p className="text-xs text-gray-600">
                Agar aap Mac par hain to <b>System Settings ➔ Privacy & Security ➔ Microphone</b> me browser ko on karein.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (onTryAgain) onTryAgain();
                else window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1797c2] to-[#20c7ff] hover:opacity-95 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              Try Again 🎙️
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MicPermissionModal;
