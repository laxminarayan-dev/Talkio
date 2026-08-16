import axios from "axios";
import Cookies from "js-cookie";
import { useState, useRef, useEffect, useMemo, useContext } from "react";
import { LuMessageSquareText } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import socket from "../store/socket";
import {
  ChatContext,
  DEFAULT_CHAT_BACKGROUND,
} from "../store/ChatContext";
import MessageBubble from "../components/MessageBubble";
import { isMobile, isTablet, isDesktop } from "react-device-detect";
import { getDateLabel, isSameDay } from "../utils/time";
const backend_url = import.meta.env.VITE_BACKEND_URL;

const ChatSection = () => {
  const navigate = useNavigate();
  const {
    conversations,
    setConversations,
    getChatBackground,
    setChatBackgroundForConversation,
  } = useContext(ChatContext);
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
  const [replyMessage, setReplyMessage] = useState(null);
  const [sendingMessages, setSendingMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const isTypingRef = useRef(false);
  const typingStopTimerRef = useRef(null);
  const token = Cookies.get("token");

  // const isTouchDevice =
  //   "ontouchstart" in window || navigator.maxTouchPoints > 0;
  // const isRealDesktop = isDesktop && !isTouchDevice;

  useEffect(() => {
    if (userId === token) {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    const loadConversationBackground = async () => {
      if (!token || !userId) return;

      try {
        const res = await axios.post(
          `${backend_url}/api/messages/conversation-background/get`,
          {
            userId: token,
            withUserId: userId,
          },
        );

        const incomingBackground = String(res.data?.backgroundUrl || "").trim();
        if (incomingBackground) {
          setChatBackgroundForConversation(userId, incomingBackground);
        }
      } catch (error) {
        console.error("Error loading conversation background", error);
      }
    };

    loadConversationBackground();
  }, [token, userId, setChatBackgroundForConversation]);

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
      navigate("/");
    }
  };

  useEffect(() => {
    const currentConversation = conversations.find(
      (conv) => conv.withUser === userId,
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
        (msg) => msg.sender === userId && !msg.isSeen,
      );

      if (unseenExists) {
        const seenAt = new Date().toISOString();
        // ✅ Update seen status for messages sent by the other user
        const newMessagesList = currentConversation.messages.map((msg) =>
          msg.sender === userId
            ? { ...msg, isSeen: true, seenAt: seenAt }
            : msg,
        );
        setMessages(newMessagesList);
        setConversations((prevConvs) =>
          prevConvs.map((conv) =>
            conv.withUser === userId
              ? { ...conv, messages: newMessagesList }
              : conv,
          ),
        );
        // emit that new message is seen
        socket.emit("messagesSeen", {
          senderId: userId,
          receiverId: token,
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
  }, [messages, replyMessage]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [messages]);

  const emitStopTyping = () => {
    if (!isTypingRef.current) return;
    socket.emit("typing", {
      to: userId,
      from: token,
      isTyping: false,
    });
    isTypingRef.current = false;
  };

  const handleTypingInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!userId || !token) return;

    if (value.trim().length > 0) {
      if (!isTypingRef.current) {
        socket.emit("typing", {
          to: String(userId),
          from: token,
          isTyping: true,
        });
        isTypingRef.current = true;
      }

      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }

      typingStopTimerRef.current = setTimeout(() => {
        emitStopTyping();
      }, 1200);
      return;
    }

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }

    emitStopTyping();
  };

  useEffect(() => {
    const handleTyping = (payload) => {
      const from = String(
        payload?.from ?? payload?.senderId ?? payload?.userId ?? "",
      );
      const typingValue = Boolean(payload?.isTyping ?? payload?.typing);

      if (from === String(userId)) {
        setIsOtherUserTyping(typingValue);
      }
    };

    const handleMessageReacted = ({ messageId, reaction }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, reaction } : msg,
        ),
      );

      setConversations((prev) =>
        prev.map((conv) =>
          conv.withUser === userId
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg._id === messageId ? { ...msg, reaction } : msg,
                ),
              }
            : conv,
        ),
      );
    };

    socket.on("typing", handleTyping);
    socket.on("message-reacted", handleMessageReacted);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("message-reacted", handleMessageReacted);
    };
  }, [userId, setConversations]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }
      emitStopTyping();
    };
  }, [userId, token]);

  const handleReactToMessage = async (messageId) => {
    const currentMessage = messages.find((msg) => msg._id === messageId);
    const nextReaction = currentMessage?.reaction === "❤️" ? null : "❤️";

    try {
      const res = await axios.post(`${backend_url}/api/messages/toggle-reaction`, {
        messageId,
        userId: token,
        reaction: nextReaction,
      });

      const updatedMessage = res.data;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, reaction: updatedMessage.reaction }
            : msg,
        ),
      );

      setConversations((prev) =>
        prev.map((conv) =>
          conv.withUser === userId
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg._id === messageId
                    ? { ...msg, reaction: updatedMessage.reaction }
                    : msg,
                ),
              }
            : conv,
        ),
      );

      socket.emit("message-reacted", {
        to: userId,
        from: token,
        messageId,
        reaction: updatedMessage.reaction,
      });
    } catch (error) {
      console.error("Failed to update reaction", error);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    emitStopTyping();

    setSending(true); // 🚫 disable input & button
    const tempId = Date.now(); // temporary unique ID
    const tempMessage = {
      _id: tempId,
      sender: token,
      content: newMessage,
      createdAt: new Date().toISOString(),
      isTemp: true,
      senderName: Cookies.get("name"),
      replyMessage: replyMessage?.content || null,
      replyMessageSender: replyMessage?.sender || null,
      replyMessageSenderName: replyMessage?.senderName || null,
    };

    // ✅ Instantly add to UI
    setMessages((prev) => [...prev, tempMessage]);
    setSendingMessages((prev) => [...prev, tempId]);
    setNewMessage("");
    setReplyMessage(null);
    try {
      const res = await axios.post(`${backend_url}/api/messages/add`, {
        sender: Cookies.get("token"),
        senderName: Cookies.get("name"),
        senderUsername: Cookies.get("username"),
        receiver: userId,
        receiverName: receiver.name,
        receiverUsername: receiver.username,
        content: newMessage,
        replyMessage: tempMessage.replyMessage,
        replyMessageSender: tempMessage.replyMessageSender,
        replyMessageSenderName: tempMessage.replyMessageSenderName,
      });

      setNewMessage("");
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? res.data : msg)),
      );
      setSendingMessages((prev) => prev.filter((id) => id !== tempId));

      socket.emit("send-message", {
        to: userId,
        toStatus: receiver.isOnline,
        message: res.data,
        from: Cookies.get("token"),
        fromStatus: true,
      });
    } catch (error) {
      console.error(error.response.data);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? { ...msg, error: true } : msg)),
      );
    }
    setSending(false);
  };

  return (
    <div
      className="md:w-[calc(100vw-24rem)] md:left-96 fixed inset-0 flex flex-col bg-slate-950 bottom-0 overflow-y-"
      style={{
        backgroundImage: `url('${getChatBackground(userId) || DEFAULT_CHAT_BACKGROUND}')`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* Chat Header */}
      <div className="flex-shrink-0 w-full h-18 top-0 bg-slate-900/90 backdrop-blur-sm p-4 border-b border-slate-700 flex items-center z-10">
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
            } border-1 border-slate-900 rounded-full`}
          ></div>
        </div>
        <div className="ml-3">
          <h2 className="font-semibold text-slate-100">
            {receiver.name || "User"}
          </h2>
          <p
            className={`text-xs ${
              isOtherUserTyping ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {isOtherUserTyping ? "typing..." : `@${receiver.username}`}
          </p>
        </div>
        <div className="ml-auto flex space-x-4">
          <button className="p-2 rounded-full hover:bg-slate-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-slate-300"
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
        className={`flex-1 flex flex-col-reverse pt-4 pb-4 overflow-y-scroll px-4 overflow-x-hidden z-0`}
      >
        {sortedMessages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center pt-16 px-6 text-center text-slate-400">
            <LuMessageSquareText size={48} />
            <h3 className="text-lg font-medium text-slate-200 mb-1">
              No messages yet.
            </h3>
            <p className="text-sm">Send your first message!</p>
          </div>
          //
        )}
        {!loading &&
          sortedMessages.map((message, index, messagesEndRef) => {
            const showDateMarker =
              index === sortedMessages.length - 1 ||
              !isSameDay(
                message.createdAt,
                sortedMessages[index + 1].createdAt,
              );

            return (
              <div key={index}>
                {showDateMarker && (
                  <div className="flex justify-center my-4">
                    <div className="bg-slate-800 text-slate-200 text-xs px-3 py-1 rounded-full shadow border border-slate-700">
                      {getDateLabel(message.createdAt)}
                    </div>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  ref={index === 0 ? messagesEndRef : null}
                  setReplyMessage={setReplyMessage}
                  sendingMessages={sendingMessages}
                  onReactToMessage={handleReactToMessage}
                />
              </div>
            );
          })}
      </div>

      {/* reply div */}
      {replyMessage != null && (
        <div className="flex-shrink-0 flex mt-2 pl-6 pr-15 min-h-fit w-full justify-center md:w-[calc(100vw-24rem)]">
          <div
            className={`bg-slate-900 p-2 border-l-6 rounded-xl flex-1 place-items-start ${
              replyMessage.sender === Cookies.get("token")
                ? "border-red-400"
                : "border-blue-400"
            }  flex items-start space-x-2 max-w-[calc(100vw-5rem)] md:max-w-[calc(100vw-29rem)]`}
          >
            <div className="flex-grow min-h-fit p-1  truncate text-white">
              <span
                className={`${
                  replyMessage.sender === Cookies.get("token")
                    ? "text-red-500"
                    : "text-blue-500"
                } font-bold`}
              >
                {replyMessage.sender === Cookies.get("token")
                  ? "You"
                  : replyMessage.senderName}
              </span>
              <br />
              <span className="text-wrap text-sm text-slate-300">
                {replyMessage.content}
              </span>
            </div>
            <button
              onClick={() => {
                setReplyMessage(null);
              }}
              className="text-slate-500 hover:text-slate-100 font-bold "
              aria-label="Cancel Reply"
            >
              <IoClose size={20} />
            </button>
          </div>
        </div>
      )}

      {isOtherUserTyping && (
        <div className="px-6 pb-1 md:w-[calc(100vw-24rem)]">
          <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-2xl">
            <span className="text-emerald-400 font-medium">
              {receiver.name || "User"}
            </span>
            <span>is typing</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:120ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:240ms]"></span>
            </span>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex-shrink-0 flex flex-col px-4  bottom-0 w-full md:w-[calc(100vw-24rem)] h-16 ">
        <form
          onSubmit={handleSendMessage}
          className="flex flex-1 items-center h-[inherit] "
        >
          <textarea
            value={newMessage}
            onChange={handleTypingInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={emitStopTyping}
            placeholder="Type a message"
            disabled={sending}
            rows={1}
            enterKeyHint="enter"
            className="flex-1 focus:ring-0 focus:outline-none px-4 py-2 rounded-full bg-slate-900/90 border-2 border-slate-700 text-slate-100 placeholder:text-slate-500 mx-2 shadow resize-none overflow-y-auto max-h-32"
          />

          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className={`p-2 rounded-full shadow ${
              newMessage.trim()
                ? "bg-indigo-500 hover:bg-indigo-600"
                : "bg-slate-700 cursor-not-allowed"
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
