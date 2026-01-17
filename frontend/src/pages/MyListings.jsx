import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const MyListings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyItems = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again");
        navigate("/login");
        return;
      }

      const res = await API.get("/items/my");

      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("MY LISTINGS ERROR:", err.response?.data || err.message);

      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        alert("Failed to load listings");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
    // eslint-disable-next-line
  }, []);

  const markAsSold = async (id) => {
    try {
      await API.put(`/items/sold/${id}`);
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isSold: true } : item))
      );
    } catch (err) {
      console.error("MARK SOLD ERROR:", err.response?.data || err.message);
      alert("Failed to mark as sold");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await API.delete(`/items/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("DELETE ITEM ERROR:", err.response?.data || err.message);
      alert("Failed to delete item");
    }
  };

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h2>My Listings</h2>

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No listings yet</p>
      ) : (
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
                src={item.image?.replace(
                  "/upload/",
                  "/upload/f_auto,q_auto,w_400/"
                )}
                alt={item.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.png";
                }}
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
      )}
    </div>
  );
};

export default MyListings;
