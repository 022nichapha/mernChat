export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok"
    });
}
