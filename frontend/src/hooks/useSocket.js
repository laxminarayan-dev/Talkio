import { useEffect, useContext, useState, useCallback } from "react";
import socket from "../store/socket";
import { ChatContext } from "../store/ChatContext";
import Cookies from "js-cookie";
import { useConversations } from "./useConversations";

// ✅ Utility functions to get token and username
const getToken = () => Cookies.get("token");
const getUsername = () => Cookies.get("username");

export const useSocket = () => {
    const { setConversations, setChatBackgroundForConversation } = useContext(ChatContext);
    const { loadConversations } = useConversations();
    const [connection, setConnection] = useState(false);

    // ✅ Handler: when socket connects
    const handleConnect = useCallback(() => {

        loadConversations(); // load all conversations
        setConnection(true)
    }, []);

    // ✅ Handler: when socket disconnects
    const handleDisconnect = useCallback((reason) => {
        // alert("disconnect reason : ", reason)

        setConnection(false);
    }, []);

    // ✅ Handler: receive new message
    const handleReceive = useCallback(
        ({ message, toStatus, fromStatus }) => {
            const token = getToken();
            setConversations((prev) => {
                const exists = prev.some(
                    (conv) =>
                        conv.withUser === message.sender ||
                        conv.withUser === message.receiver
                );

                if (exists) {
                    return prev.map((conv) =>
                        conv.withUser === message.sender || conv.withUser === message.receiver
                            ? {
                                ...conv,
                                messages: [...conv.messages, message],
                                lastMessage: message,
                                lastMessageAt: message.createdAt || new Date().toISOString(),
                                isTyping: false,
                            }
                            : conv
                    );
                }

                // If conversation doesn’t exist, create a new one
                const newWithUser =
                    message.sender === token ? message.receiver : message.sender;

                const newConversation = {
                    withUser: newWithUser,
                    otherName:
                        message.sender === token
                            ? message.receiverName
                            : message.senderName,
                    otherUsername:
                        message.sender === token
                            ? message.receiverUsername
                            : message.senderUsername,
                    messages: [message],
                    lastMessage: message,
                    lastMessageAt: message.createdAt || new Date().toISOString(),
                    isOnline: message.sender === token ? toStatus : fromStatus,
                    isTyping: false,
                };

                return [newConversation, ...prev];
            });
        },
        [setConversations]
    );

    // ✅ Handler: someone comes online
    const handleSomeoneOnline = useCallback(
        ({ userId }) => {
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.withUser === userId ? { ...conv, isOnline: true } : conv
                )
            );
        },
        [setConversations]
    );

    // ✅ Handler: someone goes offline
    const handleSomeoneOffline = useCallback(
        ({ userId }) => {
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.withUser === userId ? { ...conv, isOnline: false } : conv
                )
            );
        },
        [setConversations]
    );

    // ✅ Handler: message seen acknowledgment
    const handleMessageSeenAck = useCallback(
        ({ receiverId, seenAt }) => {
            setConversations((prev) =>
                prev.map((conv) => {
                    if (conv.withUser === receiverId) {
                        const updatedMessages = conv.messages.map((msg) =>
                            msg.receiver === receiverId ? { ...msg, isSeen: true, seenAt } : msg
                        );
                        return { ...conv, messages: updatedMessages };
                    }
                    return conv;
                })
            );
        },
        [setConversations]
    );

    // ✅ Handler: typing status from another user
    const handleTyping = useCallback(
        (payload) => {
            const from = String(payload?.from ?? payload?.senderId ?? payload?.userId ?? "");
            const typingValue = Boolean(payload?.isTyping ?? payload?.typing);
            setConversations((prev) =>
                prev.map((conv) =>
                    String(conv.withUser) === from ? { ...conv, isTyping: typingValue } : conv
                )
            );
        },
        [setConversations]
    );

    // ✅ Handler: shared chat background updated
    const handleChatBackgroundUpdated = useCallback(
        (payload) => {
            const from = String(payload?.from || "");
            const withUserId = String(payload?.withUserId || "");
            const backgroundUrl = String(payload?.backgroundUrl || "");
            const token = String(getToken() || "");

            // For receiver, map is current sender; for sender, map is withUserId.
            const targetUserId = from === token ? withUserId : from;
            if (!targetUserId) return;

            setChatBackgroundForConversation(targetUserId, backgroundUrl);
        },
        [setChatBackgroundForConversation]
    );

    // ✅ Setup and cleanup socket listeners
    useEffect(() => {
        const token = getToken();
        if (!token) return;

        socket.auth = { userId: token, username: getUsername() };
        socket.connect();

        if (socket.connected) handleConnect();

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("receive-message", handleReceive);
        socket.on("someone-online", handleSomeoneOnline);
        socket.on("someone-offline", handleSomeoneOffline);
        socket.on("messagesSeenAck", handleMessageSeenAck);
        socket.on("typing", handleTyping);
        socket.on("chat-background-updated", handleChatBackgroundUpdated);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("receive-message", handleReceive);
            socket.off("someone-online", handleSomeoneOnline);
            socket.off("someone-offline", handleSomeoneOffline);
            socket.off("messagesSeenAck", handleMessageSeenAck);
            socket.off("typing", handleTyping);
            socket.off("chat-background-updated", handleChatBackgroundUpdated);
        };
    }, [
        handleConnect,
        handleDisconnect,
        handleReceive,
        handleSomeoneOnline,
        handleSomeoneOffline,
        handleMessageSeenAck,
        handleTyping,
        handleChatBackgroundUpdated,
    ]);

    return { connection };
};
