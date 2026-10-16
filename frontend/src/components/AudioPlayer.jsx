import React, { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause, FaMicrophone } from "react-icons/fa6";

function AudioPlayer({ src, initialDuration = 0, isSender = false }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Speeds: 1x -> 1.5x -> 2x
  const speeds = [1, 1.5, 2];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Audio playback error:", err));
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = Number(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const cycleSpeed = (e) => {
    e.stopPropagation();
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl w-full max-w-[280px] sm:max-w-[320px] select-none ${
        isSender
          ? "bg-white/15 text-white backdrop-blur-xs"
          : "bg-white/20 text-white backdrop-blur-xs"
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button with WhatsApp Mic badge */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={togglePlay}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-all active:scale-95 bg-white text-[#1797c2] hover:bg-slate-100"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <FaPause className="w-4 h-4 ml-0" />
          ) : (
            <FaPlay className="w-4 h-4 ml-0.5" />
          )}
        </button>
        <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center absolute -bottom-1 -right-1 shadow-sm border border-white text-[9px]">
          <FaMicrophone className="w-2.5 h-2.5" />
        </span>
      </div>

      {/* Progress & Waveform */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        
        {/* Scrubber slider */}
        <div className="relative flex items-center h-4 cursor-pointer">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
            style={{
              background: `linear-gradient(to right, white ${progressPercent}%, rgba(255,255,255,0.25) ${progressPercent}%)`,
            }}
          />
        </div>

        {/* Time stamps & Speed button */}
        <div className="flex items-center justify-between text-[11px] font-medium text-white/90 mt-0.5">
          <span>{formatTime(currentTime > 0 ? currentTime : duration)}</span>

          {/* Speed badge button */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-1.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-[10px] font-bold tracking-tight cursor-pointer transition-all"
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
