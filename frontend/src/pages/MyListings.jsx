import { useEffect, useState } from "react";
import API from "../api/axios";

const IMAGE_BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

const MyListings = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    const res = await API.get("/items/my");
    setItems(res.data);
  };

  const markAsSold = async (id) => {
    await API.put(`/items/sold/${id}`);

    setItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, isSold: true } : item
      )
    );
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    await API.delete(`/items/${id}`);
    setItems((prev) => prev.filter((item) => item._id !== id));
  };

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h2>My Listings</h2>

      {items.length === 0 && <p>No listings yet</p>}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {items.map((item) => (
          <div
            key={item._id}
            style={{
              background: "#2f2f2f",
              padding: "15px",
              width: "250px",
              borderRadius: "10px",
              opacity: item.isSold ? 0.6 : 1,
            }}
          >
            <img
              src={`${IMAGE_BASE_URL}/uploads/${item.image}`}
              alt=""
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />

            <h3>{item.title}</h3>
            <p>₹{item.price}</p>

            {item.isSold ? (
              <p style={{ color: "lightgreen" }}>✅ SOLD</p>
            ) : (
              <button
                onClick={() => markAsSold(item._id)}
                style={{
                  background: "#27ae60",
                  color: "white",
                  width: "100%",
                  padding: "8px",
                  border: "none",
                  borderRadius: "6px",
                  marginBottom: "8px",
                  cursor: "pointer",
                }}
              >
                Mark as Sold
              </button>
            )}

            <button
              onClick={() => deleteItem(item._id)}
              style={{
                background: "red",
                color: "white",
                width: "100%",
                padding: "8px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyListings;
