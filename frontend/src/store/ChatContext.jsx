import React, { createContext, useState } from "react";

export const ChatContext = createContext();
export const DEFAULT_CHAT_BACKGROUND = "/kukki-bg.png";

export const ChatProvider = ({ children }) => {
    // const [selectedUser, setSelectedUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [conversationBackgrounds, setConversationBackgrounds] = useState(() => {
        const saved = localStorage.getItem("conversation_backgrounds");
        if (!saved) return {};
        try {
            return JSON.parse(saved);
        } catch {
            return {};
        }
    });

    const persistBackgrounds = (nextMap) => {
        localStorage.setItem("conversation_backgrounds", JSON.stringify(nextMap));
    };

    const getChatBackground = (withUserId) => {
        if (!withUserId) return DEFAULT_CHAT_BACKGROUND;
        return conversationBackgrounds[String(withUserId)] || DEFAULT_CHAT_BACKGROUND;
    };

    const setChatBackgroundForConversation = (withUserId, nextUrl) => {
        if (!withUserId) return;
        const normalized = (nextUrl || "").trim() || DEFAULT_CHAT_BACKGROUND;
        setConversationBackgrounds((prev) => {
            const nextMap = {
                ...prev,
                [String(withUserId)]: normalized,
            };
            persistBackgrounds(nextMap);
            return nextMap;
        });
    };

    const resetChatBackgroundForConversation = (withUserId) => {
        setChatBackgroundForConversation(withUserId, DEFAULT_CHAT_BACKGROUND);
    };

    return (
        <ChatContext.Provider
            value={{
                conversations,
                setConversations,
                conversationBackgrounds,
                getChatBackground,
                setChatBackgroundForConversation,
                resetChatBackgroundForConversation,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
