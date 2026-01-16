import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

const formatTime = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const Inbox = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await API.get("/chats/my-chats");
      setChats(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("FETCH CHATS ERROR:", err.response?.data || err.message);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    const ok = window.confirm("Remove this chat from your inbox?");
    if (!ok) return;

    try {
      await API.delete(`/chats/${chatId}`);
      setChats((prev) => prev.filter((c) => c._id !== chatId));
    } catch (err) {
      console.log("DELETE CHAT ERROR:", err.response?.data || err.message);
      alert("Failed to delete chat");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchChats();
  }, [token]);

  // 🔥 live update WITHOUT refresh flash
  useEffect(() => {
    if (!token) return;

    const handler = ({ chatId, action }) => {
      if (!chatId) return;

      // best stable: just refetch list (but not on every message)
      // here we update small changes only:
      if (action === "increment") {
        setChats((prev) =>
          prev.map((c) =>
            c._id === chatId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
          )
        );
      }

      if (action === "reset") {
        setChats((prev) =>
          prev.map((c) => (c._id === chatId ? { ...c, unreadCount: 0 } : c))
        );
      }
    };

    socket.on("unreadUpdate", handler);

    return () => socket.off("unreadUpdate", handler);
  }, [token]);

  if (!token) {
    return (
      <div style={{ padding: "30px", color: "white" }}>
        <h2>Please login first</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "linear-gradient(180deg, #0b1220, #0f172a)",
        padding: "18px 14px 40px",
      }}
    >
      <div className="chats-header">
        <div>
          <h1 className="chats-title">💬 Chats</h1>
          <p className="chats-subtitle">Your conversations in one place</p>
        </div>

        <button className="chats-refresh" onClick={fetchChats}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: "white" }}>Loading...</div>
      ) : chats.length === 0 ? (
        <div className="chats-empty">
          <h2 style={{ margin: 0, color: "white" }}>No chats yet 😅</h2>
          <p style={{ marginTop: "8px", color: "rgba(255,255,255,0.7)" }}>
            Start a chat from any item listing.
          </p>

          <button className="chats-home" onClick={() => navigate("/")}>
            🏠 Go to Home
          </button>
        </div>
      ) : (
        <div className="chats-list">
          {chats.map((c) => {
            const isBuyer = c.buyer?._id === user.id;
            const other = isBuyer ? c.seller : c.buyer;

            const otherName = other?.name || other?.username || "User";
            const itemTitle = c.item?.title || "Item";

            const lastMsg = c.messages?.[c.messages.length - 1];
            const lastText = lastMsg?.text || "Say hi 👋";
            const lastTime = lastMsg?.createdAt ? formatTime(lastMsg.createdAt) : "";

            return (
              <div key={c._id} className="chat-card">
                <div className="chat-left" onClick={() => navigate(`/chat/${c._id}`)}>
                  <div className="chat-avatar">{otherName?.[0]?.toUpperCase() || "U"}</div>

                  <div className="chat-info">
                    <div className="chat-top">
                      <div className="chat-name">{otherName}</div>
                      <div className="chat-time">{lastTime}</div>
                    </div>

                    <div className="chat-item">📦 {itemTitle}</div>
                    <div className="chat-last">{lastText}</div>
                  </div>
                </div>

                <div className="chat-actions">
                  {c.unreadCount > 0 && <div className="chat-unread">{c.unreadCount}</div>}

                  <button
                    className="chat-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(c._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .chats-header{
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:12px;
          margin-bottom:14px;
          flex-wrap:wrap;
        }
        .chats-title{
          margin:0;
          color:white;
          font-size:22px;
          font-weight:900;
        }
        .chats-subtitle{
          margin:6px 0 0;
          color: rgba(255,255,255,0.7);
          font-size:13px;
          font-weight:700;
        }
        .chats-refresh{
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.16);
          color:white;
          padding: 10px 12px;
          border-radius: 12px;
          cursor:pointer;
          font-weight:900;
        }
        .chats-empty{
          margin-top: 40px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          padding: 20px;
          text-align:center;
        }
        .chats-home{
          margin-top: 12px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border:none;
          color:white;
          padding: 12px 14px;
          border-radius: 14px;
          cursor:pointer;
          font-weight:900;
          width: 100%;
          max-width: 260px;
        }
        .chats-list{
          display:flex;
          flex-direction:column;
          gap:10px;
        }
        .chat-card{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 10px 18px rgba(0,0,0,0.25);
          transition: 0.15s ease;
        }
        .chat-left{
          display:flex;
          align-items:center;
          gap:12px;
          flex:1;
          min-width:0;
          cursor:pointer;
        }
        .chat-avatar{
          width: 46px;
          height: 46px;
          border-radius: 16px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.14);
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-weight:900;
          font-size:16px;
          flex-shrink:0;
        }
        .chat-info{
          flex:1;
          min-width:0;
        }
        .chat-top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        }
        .chat-name{
          color:white;
          font-weight:900;
          font-size:14px;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        .chat-time{
          color: rgba(255,255,255,0.55);
          font-weight:800;
          font-size:11px;
          flex-shrink:0;
        }
        .chat-item{
          margin-top:4px;
          color: rgba(255,255,255,0.75);
          font-weight:800;
          font-size:12px;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        .chat-last{
          margin-top:6px;
          color: rgba(255,255,255,0.85);
          font-weight:700;
          font-size:13px;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        .chat-actions{
          display:flex;
          align-items:center;
          gap:10px;
          flex-shrink:0;
        }
        .chat-unread{
          min-width: 22px;
          height: 22px;
          padding: 0 7px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          font-weight:900;
          font-size:12px;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .chat-delete{
          background: rgba(239,68,68,0.14);
          border: 1px solid rgba(239,68,68,0.35);
          color: #ff6b6b;
          padding: 8px 10px;
          border-radius: 12px;
          cursor:pointer;
          font-weight:900;
          font-size:12px;
        }
      `}</style>
    </div>
  );
};

export default Inbox;
