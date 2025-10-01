import { useState, useEffect, useContext } from "react";
import { ChatContext } from "../store/ChatContext";
import { fetchConversations } from "../services/conversationService";

export const useConversations = () => {
    const { conversations, setConversations } = useContext(ChatContext);
    const [sortedConversations, setSortedConversations] = useState([]);

    useEffect(() => {
        const sortConversations = () => {
            const sorted = [...conversations].sort(
                (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
            );
            setSortedConversations(sorted);
        };
        sortConversations();
    }, [conversations]);

    const loadConversations = async () => {
        try {
            const data = await fetchConversations();
            setConversations(data);
        } catch (error) {
            console.error("Error loading conversations:", error);
        }
    };

    return { sortedConversations, loadConversations };
};
