import React, { useEffect, useRef } from 'react'
import dp from "../assets/dp.webp"

function ReceiverMessage({ image, message, userImage }) {
  const scroll = useRef()

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" })
  }, [message, image])

  return (
    <div className='flex items-start gap-[10px]'>

      {/* Avatar */}
      <div className='w-[40px] h-[40px] rounded-full overflow-hidden flex justify-center items-center bg-white shadow-gray-500 shadow-lg'>
        <img src={userImage || dp} alt="user" className='h-full'/>
      </div>

      {/* Message bubble */}
      <div
        ref={scroll}
        className='w-fit max-w-[500px] px-[20px] py-[10px] bg-[rgb(23,151,194)] text-white text-[19px] rounded-tl-none rounded-2xl shadow-gray-400 shadow-lg flex flex-col gap-[10px]'
      >
        {image && (
          <img
            src={image}
            alt="msg"
            className='w-[150px] rounded-lg'
            onLoad={() => scroll.current?.scrollIntoView({ behavior: "smooth" })}
          />
        )}

        {message && <span>{message}</span>}
      </div>

    </div>
  )
}

export default ReceiverMessage
