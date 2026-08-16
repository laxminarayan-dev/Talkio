import React, { useState, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { IoCheckmarkDone } from "react-icons/io5";
import { getTime } from "../utils/time";
import Cookies from "js-cookie";

const MessageBubble = React.memo(
  ({ message, sendingMessages, setReplyMessage, onReactToMessage }) => {
    const [isSwipedRight, setIsSwipedRight] = useState(false);
    const [isSwipedLeft, setIsSwipedLeft] = useState(false);
    const lastTapRef = useRef(0);
    const DOUBLE_TAP_WINDOW = 350;

    const handleTapToReact = () => {
      const now = Date.now();
      if (lastTapRef.current && now - lastTapRef.current <= DOUBLE_TAP_WINDOW) {
        onReactToMessage?.(message._id);
        lastTapRef.current = 0;
        return;
      }

      lastTapRef.current = now;
    };

    const swipeHandler = useSwipeable(
      message["sender"] === Cookies.get("token")
        ? {
            onSwipedLeft: () => {
              setIsSwipedLeft(true);
              setReplyMessage(message);
              setTimeout(() => {
                setIsSwipedLeft(false);
              }, 200);
            },
          }
        : {
            onSwipedRight: () => {
              setIsSwipedRight(true);
              setReplyMessage(message);
              setTimeout(() => {
                setIsSwipedRight(false);
              }, 200);
            },
          },
    );

    return (
      <div
        {...swipeHandler}
        onPointerUp={handleTapToReact}
        className={`flex  align-bottom ${message.reaction ? "mb-5" : "mb-2" }  ${
          message.sender === Cookies.get("token")
            ? "justify-end"
            : "justify-start"
        } transition-transform duration-300 ease-in-out 
      ${isSwipedLeft ? "translate-x-[-3rem]" : "translate-x-0"}
      ${isSwipedRight ? "translate-x-12" : "translate-x-0"}`}
      >
        <div
          className={`relative flex flex-col justify-end gap-2 min-w-26 max-w-sm md:max-w-md p-1 rounded-xl ${
            message.sender === Cookies.get("token")
              ? "bg-[#1a1a1a] text-white rounded-br-none shadow-xl"
              : "bg-slate-800 border border-slate-700 shadow-xl text-slate-200 rounded-bl-none"
          }`}
        >
          {message.replyMessage && (
            <div
              className={`${
                message.sender === Cookies.get("token")
                  ? " rounded-br-none"
                  : " rounded-bl-none"
              } ${
                message.replyMessageSender === Cookies.get("token")
                  ? "border-red-400"
                  : "border-blue-400"
              } border-l-5 p-2 rounded-lg w-full bg-slate-700 text-slate-100`}
            >
              <p className="font-bold text-sm">
                {/* {message.replyMessageSender === Cookies.get("token")
                  ? "You" */}
                {message.replyMessageSenderName}
              </p>
              <p className="text-xs">{message.replyMessage}</p>
            </div>
          )}
          <div
            className={`flex items-end gap-2 w-full min-w-0 px-2 ${
              message.sender === Cookies.get("token") && "justify-end"
            }`}
          >
            <p
              className="min-w-[calc(100%-3rem)] break-all whitespace-pre-wrap max-w-[90%] "
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              {message.content}
            </p>
            <div className="text-[10px] flex items-center gap-1 min-w-0">
              {sendingMessages.includes(message._id) ? (
                message?.error ? (
                  <span className="text-red-500 text-[10px]">Failed</span>
                ) : (
                  <div className="loader w-3 h-3 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin"></div>
                )
              ) : (
                <>
                  <p className="min-w-10">{getTime(message.createdAt)}</p>
                  {message.sender === Cookies.get("token") && (
                    <IoCheckmarkDone
                      size={16}
                      color={message.isSeen ? "#38bdf8" : "#a5adc3"}
                    />
                  )}
                </>
              )}
            </div>
          </div>
          {message.reaction && (
            <div
              className={`absolute -bottom-5 ${
                message.sender === Cookies.get("token") ? "right-2" : "left-2"
              } bg-slate-900 border border-slate-700 rounded-full px-1 py-1.5 text-sm leading-none shadow-md select-none`}
            >
              {message.reaction}
            </div>
          )}
        </div>
      </div>
    );
  },
);
export default MessageBubble;