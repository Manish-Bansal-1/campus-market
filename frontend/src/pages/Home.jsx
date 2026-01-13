import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const Home = () => {
  const [items, setItems] = useState([]);

  // ✅ pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  const navigate = useNavigate();

  const fetchItems = async (pageNo) => {
    try {
      const res = await API.get(`/items/all?page=${pageNo}&limit=${limit}`);

      // backend pagination response: { items, total, page, totalPages }
      if (Array.isArray(res.data)) {
  setItems(res.data);
  setTotalPages(1);
} else {
  setItems(res.data.items || []);
  setTotalPages(res.data.totalPages || 1);
}

    } catch (err) {
      console.error("ITEM FETCH ERROR:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchItems(page);
  }, [page]);

  const startChat = async (itemId, sellerId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    try {
      const res = await API.post(
        "/chats/init",
        { itemId, sellerId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
        {items.map((item) => (
          <div key={item._id} className="marketplace-card">
            <img
  src={item.image?.replace("/upload/", "/upload/f_auto,q_auto,w_400/")}
  alt={item.title}
  loading="lazy"
  onError={(e) => {
    e.currentTarget.src = "/placeholder.png";
  }}
/>


            <div className="marketplace-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <h2>₹{item.price}</h2>
              <p>Seller: {item.seller?.name}</p>
            </div>

            <button onClick={() => startChat(item._id, item.seller?._id)}>
              Chat with Seller
            </button>
          </div>
        ))}
      </div>

      {/* ✅ Pagination Buttons */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "20px",
        }}
      >
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>

        <span>
          Page {page} / {totalPages}
        </span>

        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Home;
