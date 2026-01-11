import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import { io } from "socket.io-client";

const socket = io(
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
  { transports: ["websocket"] }
);

const Chat = () => {
  const { chatId } = useParams();
  const [chat, setChat] = useState(null);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* 🔹 Load chat */
  useEffect(() => {
    const loadChat = async () => {
      const res = await API.get(`/chats/single/${chatId}`);
      setChat(res.data);

      socket.emit("joinChat", chatId);
    };

    loadChat();
  }, [chatId]);

  /* 🔥 RECEIVE MESSAGE (REAL-TIME) */
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      // ❌ apna message dubara add mat karo
      if (data.chatId === chatId && data.sender !== user.id) {
        setChat((prev) => ({
          ...prev,
          messages: [...prev.messages, data],
        }));
      }
    });

    return () => socket.off("receiveMessage");
  }, [chatId, user.id]);

  /* 🔹 Auto scroll */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  /* 🔹 Send message */
  const sendMessage = async () => {
    if (!text.trim()) return;

    // 1️⃣ Save in DB
    await API.post("/chats/message", {
      chatId,
      text,
    });

    // 2️⃣ Emit socket (receiver ko milega)
    socket.emit("sendMessage", {
      chatId,
      sender: user.id,
      text,
    });

    // 3️⃣ UI me apna message add
    setChat((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { sender: user.id, text },
      ],
    }));

    setText("");
  };

  if (!chat) return <p style={{ padding: "30px" }}>Loading...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>Chat</h2>

      <div style={{ minHeight: "400px" }}>
        {chat.messages.map((msg, i) => {
          const senderId =
            typeof msg.sender === "object" ? msg.sender._id : msg.sender;

          const isMe = senderId === user.id;

          return (
            <div
              key={i}
              style={{
                background: isMe ? "#2563eb" : "#444",
                color: "white",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "10px",
                maxWidth: "60%",
                marginLeft: isMe ? "auto" : "0",
              }}
            >
              <small>{isMe ? "You" : "Seller"}</small>
              <div>{msg.text}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={{ flex: 1, padding: "10px" }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
