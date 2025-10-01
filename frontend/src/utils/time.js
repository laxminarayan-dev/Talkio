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