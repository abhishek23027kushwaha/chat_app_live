export const server_url = 
  import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.DEV 
    ? "http://localhost:8000" 
    : "https://chat-app-live-1-0u5q.onrender.com");

