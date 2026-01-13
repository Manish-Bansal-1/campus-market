import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const Inbox = () => {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("Please login again");
          navigate("/login");
          return;
        }

        const res = await API.get("/chats/my-chats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setChats(res.data);
      } catch (err) {
        console.error("INBOX FETCH ERROR:", err.response?.data || err.message);

        if (err.response?.status === 401) {
          alert("Session expired. Please login again.");
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };

    fetchChats();
  }, [navigate]);

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
            onClick={() => navigate(`/chat/${chat._id}`)}
            style={{
              background: "#fff",
              padding: "20px",
              marginBottom: "16px",
              borderRadius: "14px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
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
          </div>
        );
      })}
    </div>
  );
};

export default Inbox;
