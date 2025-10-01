import { useEffect, useContext, useState, useCallback } from "react";
import socket from "../store/socket";
import { ChatContext } from "../store/ChatContext";
import Cookies from "js-cookie";
import { useConversations } from "./useConversations";

// ✅ Utility functions to get token and username
const getToken = () => Cookies.get("token");
const getUsername = () => Cookies.get("username");

export const useSocket = () => {
    const { setConversations } = useContext(ChatContext);
    const { loadConversations } = useConversations();
    const [connection, setConnection] = useState(false);

    // ✅ Handler: when socket connects
    const handleConnect = useCallback(() => {
        console.log("✅ Socket connected");
        loadConversations(); // load all conversations
        setTimeout(() => setConnection(true), 500);
    }, []);

    // ✅ Handler: when socket disconnects
    const handleDisconnect = useCallback(() => {
        console.log("❌ Disconnected from server");
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

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("receive-message", handleReceive);
            socket.off("someone-online", handleSomeoneOnline);
            socket.off("someone-offline", handleSomeoneOffline);
            socket.off("messagesSeenAck", handleMessageSeenAck);
        };
    }, [
        handleConnect,
        handleDisconnect,
        handleReceive,
        handleSomeoneOnline,
        handleSomeoneOffline,
        handleMessageSeenAck,
    ]);

    return { connection };
};
