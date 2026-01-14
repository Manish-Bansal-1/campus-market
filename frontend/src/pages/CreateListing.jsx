import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const CreateListing = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  // ✅ WhatsApp (optional)
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // ✅ Confirm checkbox (required if whatsapp filled)
  const [confirmWhatsapp, setConfirmWhatsapp] = useState(false);

  const navigate = useNavigate();

  const submitItem = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login again");
      navigate("/login");
      return;
    }

    const trimmedWhatsapp = whatsappNumber.trim();

    // ✅ If user entered whatsapp, it MUST be exactly 10 digits
    if (trimmedWhatsapp.length > 0 && trimmedWhatsapp.length !== 10) {
      alert("⚠️ WhatsApp number must be exactly 10 digits.");
      return;
    }

    // ✅ BLOCK listing if whatsapp is filled but checkbox not ticked
    if (trimmedWhatsapp.length > 0 && confirmWhatsapp === false) {
      alert("⚠️ Please tick the checkbox to confirm your WhatsApp number");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("image", image);

    // ✅ optional whatsapp
    formData.append("whatsappNumber", trimmedWhatsapp);

    try {
      await API.post("/items/add", formData);

      alert("Item listed successfully!");
      navigate("/");
    } catch (err) {
      console.error(err.response?.data || err.message);

      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      alert("Failed to list item");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Sell Item</h2>

        <form className="auth-form" onSubmit={submitItem}>
          <input
            className="auth-input"
            placeholder="Item name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="auth-input"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <input
            className="auth-input"
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          {/* ✅ WhatsApp number optional (only digits + max 10) */}
          <input
            className="auth-input"
            type="text"
            placeholder="WhatsApp number (optional) e.g. 9876543210"
            value={whatsappNumber}
            inputMode="numeric"
            maxLength={10}
            onChange={(e) => {
              // ✅ only digits allowed + max 10 digits
              const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
              setWhatsappNumber(onlyDigits);

              // ✅ if user clears number, untick checkbox
              if (!onlyDigits.trim()) {
                setConfirmWhatsapp(false);
              }
            }}
          />

          {/* ⚠️ Warning + checkbox (only show if whatsapp filled) */}
          {whatsappNumber.trim().length > 0 && (
            <div
              style={{
                background: "#fff3cd",
                color: "#856404",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              ⚠️ Make sure this WhatsApp number is active and yours. Incorrect
              numbers may cause unexpected problems in the future.
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "10px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmWhatsapp}
                  onChange={(e) => setConfirmWhatsapp(e.target.checked)}
                />
                <span>I confirm this is my WhatsApp number</span>
              </label>
            </div>
          )}

          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />

          <button className="auth-btn">Post Item</button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
