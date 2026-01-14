import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const Home = () => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  // ✅ logged in user
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    API.get("/items/all")
      .then((res) => {
        // backend response can be {items: []} OR direct []
        if (Array.isArray(res.data)) {
          setItems(res.data);
        } else {
          setItems(res.data.items || []);
        }
      })
      .catch((err) => console.error("ITEM FETCH ERROR:", err));
  }, []);

  const startChat = async (itemId, sellerId) => {
    if (!localStorage.getItem("token")) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    // ✅ stop if seller clicks his own item
    if (sellerId === user.id) {
      alert("Bhai ye tumhara hi item hai 😄");
      return;
    }

    try {
      const res = await API.post("/chats/init", {
        itemId,
        sellerId,
      });

      navigate(`/chat/${res.data._id}`);
    } catch (err) {
      console.error("START CHAT ERROR:", err.response?.data || err.message);
      alert("Unable to start chat");
    }
  };

  // ✅ WhatsApp Open function
  const openWhatsApp = (whatsappNumber, itemTitle) => {
    if (!whatsappNumber) return;

    const cleanNumber = whatsappNumber.replace(/\s+/g, "").replace("+", "");

    const message = `Hi! I'm interested in your item: ${itemTitle}`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank");
  };

  return (
    <div className="marketplace-container">
      <h1 className="marketplace-title">Campus Marketplace</h1>

      <div className="marketplace-grid">
        {Array.isArray(items) &&
          items.map((item) => {
            const isMyItem = item.seller?._id === user.id;
            const hasWhatsapp = !!item.whatsappNumber;

            return (
              <div key={item._id} className="marketplace-card">
                <img src={item.image} alt={item.title} />

                <div className="marketplace-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <h2>₹{item.price}</h2>
                  <p>Seller: {item.seller?.name}</p>

                  {/* ✅ Show whatsapp text only if available */}
                  {item.whatsappNumber && (
  <p style={{ fontSize: "13px", color: "#333" }}>
    📱 WhatsApp: {item.whatsappNumber}
  </p>
)}

                </div>

                {/* Buttons */}
                {isMyItem ? (
                  <button
                    disabled
                    style={{
                      background: "#666",
                      cursor: "not-allowed",
                    }}
                  >
                    This is your item
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "10px", padding: "12px" }}>
                    <button
                      onClick={() => startChat(item._id, item.seller?._id)}
                      style={{
                        flex: 1,
                        background: "#3498db",
                        color: "white",
                        border: "none",
                        padding: "12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Chat
                    </button>

                    {/* ✅ WhatsApp button ONLY if number exists */}
                    {item.whatsappNumber && (
  <button
    onClick={() => {
      const cleanNumber = item.whatsappNumber
        .replace(/\s+/g, "")
        .replace("+", "");

      const msg = `Hi! I'm interested in your item: ${item.title}`;
      window.open(
        `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`,
        "_blank"
      );
    }}
    style={{
      background: "#25D366",
      color: "white",
      border: "none",
      padding: "12px",
      cursor: "pointer",
      marginTop: "8px",
    }}
  >
    WhatsApp Seller
  </button>
)}

                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Home;
