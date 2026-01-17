import { useEffect, useState } from "react";
import API from "../api/axios";

const MyListings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Edit modal states
  const [editOpen, setEditOpen] = useState(false);
  const [editItemId, setEditItemId] = useState(null);

  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      const res = await API.get("/items/my");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("MY LISTINGS ERROR:", err.response?.data || err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
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

  // ✅ open edit modal
  const openEdit = (item) => {
    setEditItemId(item._id);
    setEditTitle(item.title || "");
    setEditPrice(item.price || "");
    setEditDesc(item.description || "");
    setEditWhatsapp(item.whatsappNumber || "");
    setEditOpen(true);
  };

  // ✅ save edit
  const saveEdit = async () => {
    if (!editItemId) return;

    if (!editTitle.trim()) return alert("Title required");
    if (!editPrice) return alert("Price required");

    try {
      const payload = {
        title: editTitle.trim(),
        price: editPrice,
        description: editDesc,
        whatsappNumber: editWhatsapp,
      };

      const res = await API.put(`/items/update/${editItemId}`, payload);

      // update UI instantly
      setItems((prev) =>
        prev.map((it) => (it._id === editItemId ? res.data : it))
      );

      setEditOpen(false);
      setEditItemId(null);
    } catch (err) {
      console.error("EDIT SAVE ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to update listing");
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "linear-gradient(180deg, #0b1220, #0f172a)",
        padding: "18px 14px 40px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "white",
              fontSize: "26px",
              fontWeight: 900,
            }}
          >
            📌 My Listings
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "rgba(255,255,255,0.65)",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            Manage your items (mark sold / delete / edit)
          </p>
        </div>

        <button
          onClick={fetchMyItems}
          style={{
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "white",
            padding: "10px 12px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* BODY */}
      {loading ? (
        <p style={{ color: "white" }}>Loading...</p>
      ) : items.length === 0 ? (
        <div
          style={{
            marginTop: "40px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "18px",
            padding: "20px",
            textAlign: "center",
            color: "white",
          }}
        >
          <h2 style={{ margin: 0 }}>No listings yet 😅</h2>
          <p style={{ marginTop: "8px", color: "rgba(255,255,255,0.7)" }}>
            Go to Sell Item page to add your first listing.
          </p>
        </div>
      ) : (
        <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 360px))",
    justifyContent: "center",
    gap: "14px",
  }}
>

          {items.map((item) => (
            <div
              key={item._id}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 12px 22px rgba(0,0,0,0.28)",
                opacity: item.isSold ? 0.6 : 1,
              }}
            >
              <img
                src={item.image?.replace(
                  "/upload/",
                  "/upload/f_auto,q_auto,w_600/"
                )}
                alt={item.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.png";
                }}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                }}
              />

              <div style={{ padding: "14px" }}>
                <h3
                  style={{
                    margin: 0,
                    color: "white",
                    fontWeight: 900,
                    fontSize: "18px",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 900,
                    fontSize: "16px",
                  }}
                >
                  ₹{item.price}
                </p>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "rgba(255,255,255,0.65)",
                    fontWeight: 700,
                    fontSize: "13px",
                    minHeight: "18px",
                  }}
                >
                  {item.description || "No description"}
                </p>

                {/* SOLD */}
                {item.isSold ? (
                  <p
                    style={{
                      marginTop: "10px",
                      color: "#22c55e",
                      fontWeight: 900,
                    }}
                  >
                    ✅ SOLD
                  </p>
                ) : (
                  <button
                    onClick={() => markAsSold(item._id)}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "14px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 900,
                      color: "white",
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    }}
                  >
                    Mark as Sold
                  </button>
                )}

                {/* EDIT */}
                <button
                  onClick={() => openEdit(item)}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "12px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    cursor: "pointer",
                    fontWeight: 900,
                    color: "white",
                    background: "rgba(37,99,235,0.18)",
                  }}
                >
                  ✏️ Edit Listing
                </button>

                {/* DELETE */}
                <button
                  onClick={() => deleteItem(item._id)}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "12px",
                    borderRadius: "14px",
                    border: "1px solid rgba(239,68,68,0.35)",
                    cursor: "pointer",
                    fontWeight: 900,
                    color: "#ff6b6b",
                    background: "rgba(239,68,68,0.14)",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ EDIT MODAL */}
      {editOpen && (
        <div
          onClick={() => setEditOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "520px",
              maxWidth: "100%",
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "18px",
              padding: "18px",
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
            }}
          >
            <h2 style={{ margin: 0, color: "white", fontWeight: 900 }}>
              ✏️ Edit Listing
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                style={modalInput}
              />

              <input
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Price"
                style={modalInput}
              />

              <input
                value={editWhatsapp}
                onChange={(e) => setEditWhatsapp(e.target.value)}
                placeholder="WhatsApp Number (optional)"
                style={modalInput}
              />

              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description"
                rows={4}
                style={{ ...modalInput, resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={saveEdit}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 900,
                  color: "white",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                }}
              >
                Save
              </button>

              <button
                onClick={() => setEditOpen(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 900,
                  color: "white",
                  background: "rgba(239,68,68,0.85)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const modalInput = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
  fontWeight: 800,
};

export default MyListings;
