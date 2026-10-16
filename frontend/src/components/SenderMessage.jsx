import React, { useEffect, useRef } from 'react'
import dp from "../assets/dp.webp"
import AudioPlayer from "./AudioPlayer"

function SenderMessage({ image, message, audio, audioDuration, userImage }) {
  const scroll = useRef()

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" })
  }, [message, image, audio])

  return (
    <div className='flex items-start gap-[10px]'>

      {/* Message bubble */}
      <div
        ref={scroll}
        className='w-fit max-w-[500px] px-[16px] py-[10px] bg-[rgb(23,151,194)] text-white text-[16px] sm:text-[18px] rounded-tr-none rounded-2xl ml-auto shadow-md flex flex-col gap-[8px]'
      >
        {image && (
          <img
            src={image}
            alt="msg"
            className='w-[150px] rounded-lg'
            onLoad={() => scroll.current?.scrollIntoView({ behavior: "smooth" })}
          />
        )}

        {audio && (
          <AudioPlayer src={audio} initialDuration={audioDuration} isSender={true} />
        )}

        {message && <span>{message}</span>}
      </div>

      {/* Avatar */}
      <div className='w-[40px] h-[40px] rounded-full overflow-hidden flex justify-center items-center bg-white shadow-md shrink-0 border border-white/60'>
        <img src={userImage || dp} alt="me" className='h-full w-full object-cover'/>
      </div>

    </div>
  )
}

export default SenderMessage
