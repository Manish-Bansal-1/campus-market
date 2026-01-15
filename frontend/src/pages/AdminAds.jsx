import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const AdminAds = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Admin check (frontend protection)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      alert("❌ You are not allowed to access Admin Panel");
      navigate("/");
      return;
    }
  }, [navigate]);

  const fetchAds = async () => {
    try {
      const res = await API.get("/ads");
      setAds(res.data || []);
    } catch (err) {
      console.error("FETCH ADS ERROR:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleCreateAd = async (e) => {
    e.preventDefault();

    if (!title.trim() || !link.trim()) {
      alert("Title and Link are required!");
      return;
    }

    try {
      setLoading(true);

      await API.post("/ads", {
        title,
        description,
        link,
      });

      setTitle("");
      setDescription("");
      setLink("");

      await fetchAds();
      alert("Ad created!");
    } catch (err) {
      console.error("CREATE AD ERROR:", err.response?.data || err.message);
      alert("Failed to create ad");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!confirm("Delete this ad?")) return;

    try {
      await API.delete(`/ads/${id}`);
      await fetchAds();
    } catch (err) {
      console.error("DELETE AD ERROR:", err.response?.data || err.message);
      alert("Failed to delete ad");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "700px" }}>
        <h2>Admin Ads Panel</h2>

        <form className="auth-form" onSubmit={handleCreateAd}>
          <input
            className="auth-input"
            placeholder="Ad Title (required)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="auth-input"
            placeholder="Ad Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="auth-input"
            placeholder="Link (required) e.g. https://youtube.com/@channel"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            required
          />

          <button className="auth-btn" disabled={loading}>
            {loading ? "Posting..." : "Post Ad"}
          </button>
        </form>

        <hr style={{ margin: "20px 0" }} />

        <h3>All Ads</h3>

        {ads.length === 0 ? (
          <p style={{ color: "#555" }}>No ads yet</p>
        ) : (
          ads.map((ad) => (
            <div
              key={ad._id}
              style={{
                background: "#f1f1f1",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "10px",
              }}
            >
              <h4 style={{ margin: 0 }}>{ad.title}</h4>
              {ad.description && (
                <p style={{ margin: "6px 0" }}>{ad.description}</p>
              )}

              <a href={ad.link} target="_blank" rel="noreferrer">
                {ad.link}
              </a>

              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => handleDeleteAd(ad._id)}
                  style={{
                    background: "red",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAds;
