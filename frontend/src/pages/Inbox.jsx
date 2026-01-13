import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

const Inbox = () => {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const fetchChats = async () => {
    try {
      const res = await API.get("/chats/my-chats");
      setChats(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("INBOX FETCH ERROR:", err.response?.data || err.message);
    }
  };

  // ✅ delete chat
  const deleteChat = async (chatId) => {
    const ok = window.confirm("Delete this chat?");
    if (!ok) return;

    try {
      await API.delete(`/chats/${chatId}`);
      setChats((prev) => prev.filter((c) => c._id !== chatId));
    } catch (err) {
      console.error("DELETE CHAT ERROR:", err.response?.data || err.message);
      alert("Failed to delete chat");
    }
  };

  // ✅ 1st time load
  useEffect(() => {
    if (!token) return;
    fetchChats();
  }, [token]);

  // 🔥 LIVE update when message comes
  useEffect(() => {
    if (!token) return;

    const handler = () => {
      fetchChats();
    };

    socket.on("unreadUpdate", handler);

    return () => {
      socket.off("unreadUpdate", handler);
    };
  }, [token]);

  return (
    <div style={{ padding: "30px" }}>
      <h2 style={{ color: "white" }}>Your Messages</h2>

      {chats.length === 0 && <p style={{ color: "#aaa" }}>No chats yet</p>}

      {chats.map((chat) => {
        const isBuyer = chat.buyer?._id === user.id;
        const otherUser = isBuyer ? chat.seller : chat.buyer;

        return (
          <div
            key={chat._id}
            style={{
              background: "#fff",
              padding: "20px",
              marginBottom: "16px",
              borderRadius: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Left click area */}
            <div
              onClick={() => navigate(`/chat/${chat._id}`)}
              style={{
                cursor: "pointer",
                flex: 1,
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 600 }}>
                Chat with: {otherUser?.name || "User"}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#555",
                  marginTop: "4px",
                }}
              >
                Item: {chat.item?.title || "Unknown item"}
              </div>
            </div>

            {/* Right side actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {chat.unreadCount > 0 && (
                <div
                  style={{
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  {chat.unreadCount}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat._id);
                }}
                style={{
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Inbox;
