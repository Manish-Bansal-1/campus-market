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
      .then((res) => setItems(res.data))
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

  return (
    <div className="marketplace-container">
      <h1 className="marketplace-title">Campus Marketplace</h1>

      <div className="marketplace-grid">
        {items.map((item) => {
          const isMyItem = item.seller?._id === user.id;

          return (
            <div key={item._id} className="marketplace-card">
              <img src={item.image} alt={item.title} />

              <div className="marketplace-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <h2>₹{item.price}</h2>
                <p>Seller: {item.seller?.name}</p>
              </div>

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
                <button onClick={() => startChat(item._id, item.seller?._id)}>
                  Chat with Seller
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
