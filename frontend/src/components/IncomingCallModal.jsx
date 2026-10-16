import React from "react";
import { useCallContext } from "../context/CallContext";
import { MdCall, MdCallEnd, MdVideocam } from "react-icons/md";
import dp from "../assets/dp.webp";

function IncomingCallModal() {
  const { callState, callPartner, callType, acceptCall, rejectCall } = useCallContext();

  if (callState !== "incoming" || !callPartner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl flex flex-col items-center relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Pulsing Avatar */}
        <div className="relative my-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-emerald-400 shadow-xl relative z-10 bg-slate-700">
            <img
              src={callPartner.image || dp}
              alt={callPartner.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Pulsing wave rings */}
          <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping -z-0"></span>
          <span className="absolute -inset-2 rounded-full border-2 border-emerald-400/40 animate-pulse -z-0"></span>
        </div>

        {/* Caller Info */}
        <h3 className="text-white font-bold text-xl sm:text-2xl truncate max-w-[260px] leading-tight">
          {callPartner.name || callPartner.userName}
        </h3>
        <p className="text-emerald-400 text-xs sm:text-sm font-medium mt-1 flex items-center justify-center gap-1.5">
          <MdVideocam className="w-4 h-4 animate-bounce" />
          Incoming {callType === "video" ? "Video Call" : "Audio Call"}...
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-8 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => rejectCall("declined")}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-500/30 cursor-pointer transition-all"
              title="Decline"
            >
              <MdCallEnd className="w-7 h-7" />
            </button>
            <span className="text-xs text-slate-300 font-medium">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={acceptCall}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 cursor-pointer transition-all animate-bounce"
              title="Accept"
            >
              {callType === "video" ? (
                <MdVideocam className="w-7 h-7" />
              ) : (
                <MdCall className="w-7 h-7" />
              )}
            </button>
            <span className="text-xs text-slate-300 font-medium">Accept</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default IncomingCallModal;
