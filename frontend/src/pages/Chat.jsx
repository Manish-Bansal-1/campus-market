import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const getId = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") return val._id || val.id || "";
  return "";
};

const Chat = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();

  const [chat, setChat] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const [typingUser, setTypingUser] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);

  const endRef = useRef(null);
  const typingTimeout = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const myId = user?.id?.toString();

  const getOtherUserId = () => {
    if (!chat) return null;
    const buyerId = getId(chat?.buyer);
    const sellerId = getId(chat?.seller);
    if (buyerId === myId) return sellerId;
    return buyerId;
  };

  const fetchSingleChat = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/chats/single/${chatId}`);
      setChat(res.data);
    } catch (err) {
      console.log("FETCH SINGLE CHAT ERROR:", err.response?.data || err.message);
      setChat(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !chatId) return;

    fetchSingleChat();

    socket.emit("joinUser", myId);
    socket.emit("joinChat", { chatId, userId: myId });
  }, [chatId, token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages?.length, typingUser]);

  useEffect(() => {
    const typingHandler = (payload) => {
      if (!payload?.chatId) return;
      if (payload.chatId !== chatId) return;
      if (payload.userId === myId) return;

      setTypingUser(true);
      clearTimeout(typingTimeout.current);

      typingTimeout.current = setTimeout(() => {
        setTypingUser(false);
      }, 1200);
    };

    socket.on("typing", typingHandler);
    return () => socket.off("typing", typingHandler);
  }, [chatId, myId]);

  useEffect(() => {
    const otherId = getOtherUserId();
    if (!otherId) return;

    const onlineHandler = ({ userId }) => {
      if (userId === otherId) setOtherOnline(true);
    };

    const offlineHandler = ({ userId }) => {
      if (userId === otherId) setOtherOnline(false);
    };

    socket.on("userOnline", onlineHandler);
    socket.on("userOffline", offlineHandler);

    return () => {
      socket.off("userOnline", onlineHandler);
      socket.off("userOffline", offlineHandler);
    };
  }, [chat]);

  // receive message live
  useEffect(() => {
    const handler = (data) => {
      if (!data?.chatId) return;
      if (data.chatId !== chatId) return;

      const senderId = getId(data.sender);

      // ignore my own
      if (senderId === myId) return;

      setChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          messages: [
            ...(prev.messages || []),
            {
              sender: senderId,
              text: data.text,
              createdAt: data.createdAt || new Date().toISOString(),
              messageTempId: data.messageTempId || null,
              delivered: true,
              seen: false,
            },
          ],
        };
      });

      socket.emit("seen", {
        chatId,
        messageTempId: data.messageTempId,
        seenBy: myId,
      });
    };

    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [chatId, myId]);

  // delivered ack
  useEffect(() => {
    const deliveredHandler = (payload) => {
      if (!payload?.chatId) return;
      if (payload.chatId !== chatId) return;

      setChat((prev) => {
        if (!prev) return prev;

        const updated = (prev.messages || []).map((m) => {
          if (m.messageTempId && m.messageTempId === payload.messageTempId) {
            return { ...m, delivered: true };
          }
          return m;
        });

        return { ...prev, messages: updated };
      });
    };

    socket.on("deliveredAck", deliveredHandler);
    return () => socket.off("deliveredAck", deliveredHandler);
  }, [chatId]);

  // seen ack
  useEffect(() => {
    const seenHandler = (payload) => {
      if (!payload?.chatId) return;
      if (payload.chatId !== chatId) return;

      setChat((prev) => {
        if (!prev) return prev;

        const updated = (prev.messages || []).map((m) => {
          if (m.messageTempId && m.messageTempId === payload.messageTempId) {
            return { ...m, seen: true };
          }
          return m;
        });

        return { ...prev, messages: updated };
      });
    };

    socket.on("seenAck", seenHandler);
    return () => socket.off("seenAck", seenHandler);
  }, [chatId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const tempId = "temp_" + Date.now();

    const myMsg = {
      chatId,
      sender: myId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      messageTempId: tempId,
      delivered: false,
      seen: false,
    };

    // UI add instantly
    setChat((prev) => {
      if (!prev) return prev;
      return { ...prev, messages: [...(prev.messages || []), myMsg] };
    });

    setText("");

    // live emit
    socket.emit("sendMessage", myMsg);

    // DB save
    try {
      await API.post("/chats/message", { chatId, text: myMsg.text });
    } catch (err) {
      console.log("SEND MESSAGE ERROR:", err.response?.data || err.message);
      alert("Message send failed");
    }
  };

  const handleTyping = (value) => {
    setText(value);
    socket.emit("typing", { chatId, userId: myId });
  };

  if (!token) {
    return (
      <div style={{ padding: "20px", color: "white" }}>
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
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <button
          onClick={() => navigate("/chats")}
          style={{
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "white",
            padding: "10px 12px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          ⬅ Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: otherOnline ? "#22c55e" : "#64748b",
            }}
          />
          <span style={{ color: "white", fontWeight: 800, fontSize: "13px" }}>
            {otherOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "white" }}>Loading chat...</div>
      ) : !chat ? (
        <div style={{ color: "white" }}>Chat not found</div>
      ) : (
        <>
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "18px",
              padding: "14px",
              minHeight: "60vh",
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            {(chat.messages || []).length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.7)" }}>
                No messages yet. Say hi 👋
              </div>
            ) : (
              chat.messages.map((m, i) => {
                const senderId = getId(m.sender);
                const mine = senderId === myId;

                const tick =
                  mine && m.seen
                    ? "✔✔"
                    : mine && m.delivered
                    ? "✔"
                    : mine
                    ? "⏳"
                    : "";

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: mine ? "flex-end" : "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "78%",
                        padding: "10px 12px",
                        borderRadius: "14px",
                        background: mine
                          ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                          : "rgba(255,255,255,0.10)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "14px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {m.text}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.55)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        paddingLeft: "6px",
                        paddingRight: "6px",
                      }}
                    >
                      <span>{formatTime(m.createdAt)}</span>
                      {mine && <span>{tick}</span>}
                    </div>
                  </div>
                );
              })
            )}

            {typingUser && (
              <div
                style={{
                  marginTop: "8px",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 800,
                  fontSize: "13px",
                }}
              >
                typing...
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
            <input
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Type message..."
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                outline: "none",
                fontWeight: 700,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />

            <button
              onClick={sendMessage}
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                border: "none",
                color: "white",
                padding: "12px 14px",
                borderRadius: "14px",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              ➤
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
