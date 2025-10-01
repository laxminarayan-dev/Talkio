// get time from utc time string
export const getTime = (utcTime) => {
    const localDate = new Date(utcTime);

    let hours = localDate.getHours();
    const minutes = localDate.getMinutes().toString().padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12; // convert to 12-hour format
    hours = hours ? hours : 12; // hour '0' should be '12'

    return `${hours}:${minutes} ${ampm}`;
};
export const getDate = (utcTime) => {
    const localDate = new Date(utcTime);

    // ✅ Date formatting (DD/MM/YYYY or customize)
    const day = localDate.getDate().toString().padStart(2, "0");
    const month = (localDate.getMonth() + 1).toString().padStart(2, "0");
    const year = localDate.getFullYear();

    const date = `${day}/${month}/${year}`; // Change format if needed

    return `${date}`;
};

// ✅ NEW: Helper function to get date label
export const getDateLabel = (messageDate) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const msgDate = new Date(messageDate);

    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    msgDate.setHours(0, 0, 0, 0);

    if (msgDate.getTime() === today.getTime()) {
        return "Today";
    } else if (msgDate.getTime() === yesterday.getTime()) {
        return "Yesterday";
    } else {
        const day = msgDate.getDate().toString().padStart(2, "0");
        const month = (msgDate.getMonth() + 1).toString().padStart(2, "0");
        const year = msgDate.getFullYear();
        return `${day}-${month}-${year}`;
    }
};

export const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
};