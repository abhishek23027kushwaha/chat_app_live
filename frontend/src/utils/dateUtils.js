/**
 * Formats a message timestamp into user's local timezone (e.g., "10:45 AM" or "7:30 PM")
 */
export const formatMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Checks if two dates are on different days in the user's local timezone
 */
export const isDifferentDay = (date1, date2) => {
  if (!date1 || !date2) return true;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;

  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
};

/**
 * Returns a human-friendly date string for chat date separators (e.g., "Today", "Yesterday", "16 Oct 2026")
 */
export const formatChatDateSeparator = (dateString) => {
  if (!dateString) return "";
  const messageDate = new Date(dateString);
  if (isNaN(messageDate.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays > 1 && diffDays < 7) {
    // Show weekday name e.g. "Monday", "Wednesday"
    return messageDate.toLocaleDateString(undefined, { weekday: "long" });
  } else {
    // Show formatted date e.g. "16 Oct 2026"
    return messageDate.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
};
