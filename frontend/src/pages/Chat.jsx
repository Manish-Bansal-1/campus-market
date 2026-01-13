import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

const Chat = () => {
  const { chatId } = useParams();
  const [chat, setChat] = useState(null);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 🔹 Load chat + join room
  useEffect(() => {
    const loadChat = async () => {
      try {
        const res = await API.get(`/chats/single/${chatId}`);
        setChat(res.data);

        socket.emit("joinChat", chatId);
      } catch (err) {
        console.log("LOAD CHAT ERROR:", err.response?.data || err.message);
      }
    };

    loadChat();
  }, [chatId]);

  // 🔥 Receive message live
  useEffect(() => {
    const handler = (data) => {
      if (data.chatId !== chatId) return;

      const senderId =
        typeof data.sender === "object" ? data.sender?._id : data.sender;

      if (senderId === user.id) return;

      setChat((prev) => {
        if (!prev) return prev;
        return { ...prev, messages: [...prev.messages, data] };
      });
    };

    socket.on("receiveMessage", handler);

    return () => socket.off("receiveMessage", handler);
  }, [chatId, user.id]);

  // 🔹 Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // 🔹 Send message
  const sendMessage = async () => {
    if (!text.trim()) return;

    const myMsg = {
      chatId,
      sender: user.id,
      text,
      createdAt: new Date().toISOString(),
    };

    // UI instantly
    setChat((prev) => ({
      ...prev,
      messages: [...prev.messages, myMsg],
    }));

    // emit live
    socket.emit("sendMessage", myMsg);

    // save DB
    try {
      await API.post("/chats/message", { chatId, text });
    } catch (err) {
      console.log("SEND ERROR:", err.response?.data || err.message);
    }

    setText("");
  };

  if (!chat) return <p style={{ padding: "30px" }}>Loading...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>Chat</h2>

      <div style={{ minHeight: "400px" }}>
        {chat.messages.map((msg, i) => {
          const senderId =
            typeof msg.sender === "object" ? msg.sender?._id : msg.sender;

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
