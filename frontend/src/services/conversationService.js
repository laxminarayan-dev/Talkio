import Cookies from "js-cookie";
import axios from "axios";
const backend_url = import.meta.env.VITE_BACKEND_URL;
// fetching last conversations
export const fetchConversations = async () => {
    try {
        const res = await axios.post(
            `${backend_url}/api/messages/all`,
            {
                userId: Cookies.get("token"),
            }
        );
        // setConversations(res.data);
        return res.data
    } catch (err) {
        console.error("Error fetching conversations:", err);
    }
};