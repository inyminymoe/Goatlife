"use client";
import { useState, useEffect } from "react";
import IconClover from "../ui/icons/IconClover";

const messages = [
  "나의 값진 시간을 팝니다. 갓생상사.",
  "24시간 신입 사원 절찬 모집중",
  "대충 시작부터 하는 성장캐 구합니다",
];

export default function TopBanner() {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="
      w-full bg-grey-900 
      flex items-center justify-center
      px-4 py-1.5
      md:px-8 
      lg:px-16
      overflow-hidden
      relative
    "
    >
      <div
        className="
        flex items-center gap-2
        text-white font-brand
        max-w-7xl w-full justify-center
      "
      >
        {/* Clover Left */}
        <IconClover
          className="
            w-4 h-4 text-white flex-shrink-0
            md:w-4 md:h-4
            transition-transform duration-700 ease-in-out
            hover:scale-110
          "
          size={16}
        />

        {/* Main Copyright */}
        <span
          className="
          text-center transition-all duration-700 ease-in-out
          text-14 md:text-14 lg:text-16
          min-h-[1.2em]
          font-normal
        "
        >
          {messages[currentMessage]}
        </span>

        {/* Clover Right */}
        <IconClover
          className="
            w-4 h-4 text-white flex-shrink-0
            md:w-4 md:h-4
            transition-transform duration-700 ease-in-out
            hover:scale-110
          "
          size={16}
        />
      </div>
    </div>
  );
}
