import React, { createContext, useState } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    // const [selectedUser, setSelectedUser] = useState(null);
    const [conversations, setConversations] = useState([]);

    return (
        <ChatContext.Provider value={{ conversations, setConversations }}>
            {children}
        </ChatContext.Provider>
    );
};
