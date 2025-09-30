import axios from "axios";
import Cookies from "js-cookie";
import { useState, useRef, useEffect, useMemo, useContext } from "react";
import { LuMessageSquareText } from "react-icons/lu";
import { useParams } from "react-router-dom";
import { IoCheckmarkDone } from "react-icons/io5";
import socket from "../store/socket";
import { ChatContext } from "../store/ChatContext";
const backend_url = import.meta.env.BACKEND_URL;
const getTime = (utcTime) => {
  const localDate = new Date(utcTime);

  let hours = localDate.getHours();
  const minutes = localDate.getMinutes().toString().padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12; // convert to 12-hour format
  hours = hours ? hours : 12; // hour '0' should be '12'

  return `${hours}:${minutes} ${ampm}`;
};
const ChatSection = () => {
  const { conversations, setConversations } = useContext(ChatContext);
  const [loading, setLoading] = useState(false);
  const { userId } = useParams();
  const [receiver, setReceiver] = useState({
    _id: "",
    username: "",
    name: "",
    isOnline: null,
  });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const fetchUserDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${backend_url}/api/user/userDetail`, {
        userId,
      });
      const user = res.data.result;
      setReceiver({
        _id: user._id,
        username: user.username,
        name: user.name,
        isOnline: user.isOnline,
      });
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const currentConversation = conversations.find(
      (conv) => conv.withUser === userId
    );
    if (currentConversation) {
      // ✅ Set receiver
      setReceiver({
        _id: currentConversation.withUser,
        username: currentConversation.otherUsername,
        name: currentConversation.otherName,
        isOnline: currentConversation.isOnline,
      });
      // Check if there are unseen messages from others
      const unseenExists = currentConversation.messages.some(
        (msg) => msg.sender === userId && !msg.isSeen
      );

      if (unseenExists) {
        const seenAt = new Date().toISOString();
        // ✅ Update seen status for messages sent by the other user
        const newMessagesList = currentConversation.messages.map((msg) =>
          msg.sender === userId ? { ...msg, isSeen: true, seenAt: seenAt } : msg
        );
        setMessages(newMessagesList);
        setConversations((prevConvs) =>
          prevConvs.map((conv) =>
            conv.withUser === userId
              ? { ...conv, messages: newMessagesList }
              : conv
          )
        );
        // emit that new message is seen
        socket.emit("messagesSeen", {
          senderId: userId,
          receiverId: Cookies.get("token"),
          seenAt: seenAt,
        });
      } else {
        setMessages(currentConversation.messages);
      }
    } else {
      // ✅ No matching conversation → fetch user details
      fetchUserDetail();
    }
  }, [conversations, userId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    //scrollToBottom
    messagesEndRef.current?.scrollIntoView();
  }, [messages]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    try {
      const res = await axios.post(`${backend_url}/api/messages/add`, {
        sender: Cookies.get("token"),
        senderName: Cookies.get("name"),
        senderUsername: Cookies.get("username"),
        receiver: userId,
        receiverName: receiver.name,
        receiverUsername: receiver.username,
        content: newMessage,
      });
      setMessages([...messages, res.data]);
      socket.emit("send-message", {
        to: userId,
        toStatus: receiver.isOnline,
        message: res.data,
        from: Cookies.get("token"),
        fromStatus: true,
      });
    } catch (error) {
      console.error(error.response.data.error);
    }
    setNewMessage("");
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-100">
      {/* Chat Header */}
      <div className="sticky w-full h-18 top-0 bg-gray-100 p-4 border-b border-gray-400 flex items-center">
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-full ${
              receiver.isOnline ? "bg-green-500" : "bg-red-500"
            } flex items-center justify-center text-white font-bold`}
          >
            {receiver?.avatar || "U"}
          </div>
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 ${
              receiver.isOnline ? "bg-green-500" : "bg-red-500"
            } border-1 border-white rounded-full`}
          ></div>
        </div>
        <div className="ml-3">
          <h2 className="font-semibold text-gray-900">
            {receiver.name || "User"}
          </h2>
          <p className={`text-xs text-gray-600`}>@{receiver.username}</p>
        </div>
        <div className="ml-auto flex space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Messages Container */}
      <div
        className="bg-indigo-50 h-[calc(100vh-4.5rem)] flex flex-col-reverse pt-4 pb-18 overflow-y-scroll px-4"
        style={{
          backgroundImage: `url('/chat-bg-4.png')`,
          backgroundSize: "contain",
          backgroundRepeat: "repeat",
          backgroundPosition: "center",
        }}
      >
        {sortedMessages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center pt-16 px-6 text-center text-gray-500">
            <LuMessageSquareText size={48} />
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No messages yet.
            </h3>
            <p className="text-sm">Send your first message!</p>
          </div>
          //
        )}
        {!loading &&
          sortedMessages.map((message, index) => (
            <div
              key={index}
              ref={index === 0 ? messagesEndRef : null} // ✅ Anchor on first (bottom-most) message
              className={` flex align-bottom mb-2 ${
                message.sender === Cookies.get("token")
                  ? "justify-end"
                  : "justify-start"
              }`}
              onL
            >
              <div
                className={`min-w-28 max-w-xs md:max-w-md px-3 py-1 rounded-lg ${
                  message.sender === Cookies.get("token")
                    ? "bg-white  text-black rounded-br-none shadow-xl"
                    : "bg-black border  shadow-xl text-gray-200 rounded-bl-none"
                }`}
              >
                <p>{message.content}</p>
                <div
                  className={`text-[10px] flex items-center ${
                    message.sender === Cookies.get("token")
                      ? "text-black text-right justify-end gap-2"
                      : "text-gray-200"
                  }`}
                >
                  {getTime(message.createdAt)}
                  <p>
                    {message.sender == Cookies.get("token") && (
                      <>
                        {message.isSeen ? (
                          <IoCheckmarkDone size={16} color="#4263ff" />
                        ) : (
                          <IoCheckmarkDone size={16} />
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Message Input */}
      <div className="fixed flex items-center bottom-0 w-full md:w-[calc(100vw-24rem)] h-16 bg-white/20 backdrop-blur-xs p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex flex-1 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 focus:ring-0 focus:outline-none px-4 py-2 rounded-full bg-gray-100 border-2 border-gray-200 mx-2 shadow"
          />

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`p-2 rounded-full shadow ${
              newMessage.trim()
                ? "bg-indigo-500 hover:bg-indigo-600"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;
