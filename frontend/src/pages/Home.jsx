import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const Home = () => {
  const [items, setItems] = useState([]);

  // ✅ NEW
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ✅ logged in user
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ✅ Fetch items with retry (Render cold start fix)
  const fetchItems = async (retries = 3) => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/items/all");

      // backend response can be {items: []} OR direct []
      if (Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems(res.data.items || []);
      }

      setLoading(false);
    } catch (err) {
      console.error("ITEM FETCH ERROR:", err);

      if (retries > 0) {
        // wait 1.5 sec then retry
        setTimeout(() => fetchItems(retries - 1), 1500);
      } else {
        setLoading(false);
        setError("Server is waking up... Please refresh in 5 seconds 😅");
      }
    }
  };

  useEffect(() => {
    fetchItems();
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

  return (
    <div className="marketplace-container">
      <h1 className="marketplace-title">Campus Marketplace</h1>

      {/* ✅ Loading UI */}
      {loading && (
        <p style={{ textAlign: "center", color: "#aaa", marginTop: "20px" }}>
          ⏳ Loading items... (server waking up)
        </p>
      )}

      {/* ❌ Error UI */}
      {!loading && error && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ color: "#ffb3b3" }}>{error}</p>
          <button
            onClick={() => fetchItems()}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: "#3498db",
              color: "white",
            }}
          >
            Refresh Items
          </button>
        </div>
      )}

      {/* ✅ Items */}
      {!loading && !error && (
        <div className="marketplace-grid">
          {Array.isArray(items) &&
            items.map((item) => {
              const isMyItem = item.seller?._id === user.id;

              return (
                <div key={item._id} className="marketplace-card">
                  <img src={item.image} alt={item.title} />

                  <div className="marketplace-content">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <h2>₹{item.price}</h2>
                    <p>Seller: {item.seller?.name}</p>

                    {/* ✅ WhatsApp show */}
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
                              `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
                                msg
                              )}`,
                              "_blank"
                            );
                          }}
                          style={{
                            background: "#25D366",
                            color: "white",
                            border: "none",
                            padding: "12px",
                            cursor: "pointer",
                            borderRadius: "8px",
                          }}
                        >
                          WhatsApp
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Home;
