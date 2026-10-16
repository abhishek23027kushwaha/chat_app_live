import React, { useEffect, useRef } from 'react'
import dp from "../assets/dp.webp"
import AudioPlayer from "./AudioPlayer"

function ReceiverMessage({ image, message, audio, audioDuration, userImage, senderName }) {
  const scroll = useRef()

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" })
  }, [message, image, audio])

  return (
    <div className='flex items-start gap-[10px]'>

      {/* Avatar */}
      <div className='w-[40px] h-[40px] rounded-full overflow-hidden flex justify-center items-center bg-white shadow-md shrink-0 border border-gray-200'>
        <img src={userImage || dp} alt="user" className='h-full w-full object-cover'/>
      </div>

      {/* Message bubble */}
      <div
        ref={scroll}
        className='w-fit max-w-[500px] px-[16px] py-[10px] bg-[rgb(23,151,194)] text-white text-[16px] sm:text-[18px] rounded-tl-none rounded-2xl shadow-md flex flex-col gap-[8px]'
      >
        {senderName && (
          <span className="text-xs font-bold text-amber-200 leading-tight">
            {senderName}
          </span>
        )}

        {image && (
          <img
            src={image}
            alt="msg"
            className='w-[150px] rounded-lg'
            onLoad={() => scroll.current?.scrollIntoView({ behavior: "smooth" })}
          />
        )}

        {audio && (
          <AudioPlayer src={audio} initialDuration={audioDuration} isSender={false} />
        )}

        {message && <span>{message}</span>}
      </div>

    </div>
  )
}

export default ReceiverMessage
