import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { IoCheckmarkDone } from "react-icons/io5";
import { getTime } from "../utils/time";
import Cookies from "js-cookie";

const MessageBubble = React.memo(
  ({ message, sendingMessages, setReplyMessage }) => {
    const [isSwipedRight, setIsSwipedRight] = useState(false);
    const [isSwipedLeft, setIsSwipedLeft] = useState(false);

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
        className={`flex  align-bottom mb-2 ${
          message.sender === Cookies.get("token")
            ? "justify-end"
            : "justify-start"
        } transition-transform duration-300 ease-in-out 
      ${isSwipedLeft ? "translate-x-[-3rem]" : "translate-x-0"}
      ${isSwipedRight ? "translate-x-12" : "translate-x-0"}`}
      >
        <div
          className={`flex flex-col justify-end gap-2 min-w-26 max-w-sm md:max-w-md p-1 rounded-xl ${
            message.sender === Cookies.get("token")
              ? "bg-white  text-black rounded-br-none shadow-xl"
              : "bg-black border  shadow-xl text-gray-200 rounded-bl-none"
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
              } border-l-5 p-2 rounded-lg w-full bg-stone-200 text-gray-900`}
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
            className={`flex items-end gap-2 w-full px-2 ${
              message.sender === Cookies.get("token") && "justify-end"
            }`}
          >
            <p>{message.content}</p>
            <div className="text-[10px] flex items-center gap-1">
              {sendingMessages.includes(message._id) ? (
                message?.error ? (
                  <span className="text-red-500 text-[10px]">Failed</span>
                ) : (
                  <div className="loader w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                )
              ) : (
                <>
                  <p className="min-w-10">{getTime(message.createdAt)}</p>
                  {message.sender === Cookies.get("token") && (
                    <IoCheckmarkDone
                      size={16}
                      color={message.isSeen ? "#4263ff" : "#000"}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
export default MessageBubble;
