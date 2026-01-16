import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const CreateListing = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [image, setImage] = useState(null);

  // ✅ WhatsApp (optional)
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // ✅ Confirm checkbox (required if whatsapp filled)
  const [confirmWhatsapp, setConfirmWhatsapp] = useState(false);

  const [loading, setLoading] = useState(false);

  // ✅ Image Preview URL
  const previewUrl = useMemo(() => {
    if (!image) return "";
    return URL.createObjectURL(image);
  }, [image]);

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

    if (!image) {
      alert("⚠️ Please upload item image");
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
      setLoading(true);

      await API.post("/items/add", formData);

      alert("✅ Item listed successfully!");
      navigate("/");
    } catch (err) {
      console.error(err.response?.data || err.message);

      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      alert("❌ Failed to list item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-page">
      <div className="sell-card">
        <div className="sell-top">
          <div>
            <h1 className="sell-title">Sell Item 💸</h1>
            <p className="sell-sub">
              List your item and start getting chats instantly
            </p>
          </div>

          <button
            type="button"
            className="mini-back"
            onClick={() => navigate("/")}
          >
            ✖
          </button>
        </div>

        <form className="sell-form" onSubmit={submitItem}>
          <div className="field">
            <label className="label">Item title *</label>
            <input
              className="sell-input"
              placeholder="Eg: iPhone 11, Books, Cycle..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label">Description *</label>
            <textarea
              className="sell-textarea"
              placeholder="Write item condition, usage, reason to sell..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label">Price *</label>
            <div className="price-wrap">
              <span className="rupee">₹</span>
              <input
                className="sell-input price-input"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={price}
                onChange={(e) => {
                  // only digits
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  setPrice(digitsOnly);
                }}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">WhatsApp (optional)</label>
            <input
              className="sell-input"
              type="text"
              placeholder="10 digit number (eg: 9876543210)"
              value={whatsappNumber}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setWhatsappNumber(onlyDigits);

                if (!onlyDigits.trim()) {
                  setConfirmWhatsapp(false);
                }
              }}
            />
          </div>

          {/* ⚠️ Warning + checkbox (only show if whatsapp filled) */}
          {whatsappNumber.trim().length > 0 && (
            <div className="wa-warning">
              <div className="wa-title">⚠️ WhatsApp Confirmation</div>
              <div className="wa-text">
                Make sure this number is active and yours. Wrong number may
                create problems.
              </div>

              <label className="wa-check">
                <input
                  type="checkbox"
                  checked={confirmWhatsapp}
                  onChange={(e) => setConfirmWhatsapp(e.target.checked)}
                />
                <span>I confirm this is my WhatsApp number</span>
              </label>
            </div>
          )}

          {/* Image Upload */}
          <div className="field">
            <label className="label">Item Image *</label>

            <label className="upload-box">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />

              {!image ? (
                <div className="upload-inner">
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">Upload item image</div>
                  <div className="upload-sub">JPG / PNG recommended</div>
                </div>
              ) : (
                <div className="preview-wrap">
                  <img className="preview-img" src={previewUrl} alt="preview" />
                  <div className="preview-info">
                    <div className="preview-name">{image.name}</div>
                    <div className="preview-hint">Tap to change</div>
                  </div>
                </div>
              )}
            </label>
          </div>

          <button className="sell-btn" disabled={loading}>
            {loading ? "Posting..." : "🚀 Post Item"}
          </button>

          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/")}
            disabled={loading}
          >
            ⬅ Back to Home
          </button>
        </form>
      </div>

      <style>
        {`
        .sell-page{
          min-height:100vh;
          display:flex;
          justify-content:center;
          align-items:center;
          background: linear-gradient(180deg, #0f172a, #111827);
          padding:18px;
        }

        .sell-card{
          width:100%;
          max-width:520px;
          background: rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:22px;
          padding:20px;
          box-shadow:0 20px 40px rgba(0,0,0,0.35);
          backdrop-filter: blur(14px);
        }

        .sell-top{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:12px;
          margin-bottom:10px;
        }

        .mini-back{
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color:white;
          width:38px;
          height:38px;
          border-radius:12px;
          cursor:pointer;
          font-weight:900;
        }

        .sell-title{
          margin:0;
          font-size:26px;
          font-weight:900;
          color:white;
          letter-spacing:0.3px;
        }

        .sell-sub{
          margin:6px 0 0;
          font-size:13px;
          color:#cbd5e1;
        }

        .sell-form{
          display:flex;
          flex-direction:column;
          gap:14px;
          margin-top:14px;
        }

        .field{
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        .label{
          font-size:12px;
          font-weight:800;
          color: rgba(255,255,255,0.8);
          letter-spacing:0.2px;
        }

        .sell-input,
        .sell-textarea{
          width:100%;
          background: rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.14);
          color:white;
          padding:12px 14px;
          border-radius:14px;
          font-size:14px;
          outline:none;
        }

        .sell-textarea{
          resize:none;
          min-height:95px;
        }

        .sell-input::placeholder,
        .sell-textarea::placeholder{
          color: rgba(255,255,255,0.45);
        }

        .sell-input:focus,
        .sell-textarea:focus{
          border-color:#3b82f6;
          box-shadow:0 0 0 4px rgba(59,130,246,0.18);
        }

        /* PRICE */
        .price-wrap{
          display:flex;
          align-items:center;
          gap:10px;
          background: rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.14);
          border-radius:14px;
          padding:0 12px;
        }

        .rupee{
          font-weight:900;
          color:white;
          opacity:0.9;
        }

        .price-input{
          border:none !important;
          background: transparent !important;
          box-shadow:none !important;
          padding:12px 0 !important;
        }

        /* WA warning */
        .wa-warning{
          background: rgba(245,158,11,0.14);
          border:1px solid rgba(245,158,11,0.35);
          color:#fde68a;
          padding:12px;
          border-radius:14px;
        }

        .wa-title{
          font-weight:900;
          font-size:13px;
          margin-bottom:4px;
        }

        .wa-text{
          font-size:12px;
          opacity:0.95;
          line-height:1.4;
        }

        .wa-check{
          display:flex;
          gap:8px;
          align-items:center;
          margin-top:10px;
          cursor:pointer;
          font-size:13px;
          color:#fff;
        }

        /* UPLOAD */
        .upload-box{
          border:2px dashed rgba(255,255,255,0.22);
          border-radius:16px;
          padding:14px;
          text-align:center;
          cursor:pointer;
          transition:0.2s;
          background: rgba(0,0,0,0.10);
        }

        .upload-box:hover{
          background: rgba(255,255,255,0.05);
        }

        .upload-inner{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:6px;
        }

        .upload-icon{
          font-size:26px;
        }

        .upload-text{
          font-size:13px;
          font-weight:900;
          color:white;
        }

        .upload-sub{
          font-size:11px;
          color: rgba(255,255,255,0.65);
        }

        .preview-wrap{
          display:flex;
          align-items:center;
          gap:12px;
          text-align:left;
        }

        .preview-img{
          width:64px;
          height:64px;
          border-radius:14px;
          object-fit:cover;
          border:1px solid rgba(255,255,255,0.18);
        }

        .preview-info{
          display:flex;
          flex-direction:column;
          gap:4px;
        }

        .preview-name{
          color:white;
          font-weight:900;
          font-size:12px;
          max-width:280px;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .preview-hint{
          font-size:11px;
          color: rgba(255,255,255,0.65);
        }

        /* BUTTONS */
        .sell-btn{
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color:white;
          border:none;
          padding:14px;
          border-radius:16px;
          font-size:15px;
          font-weight:900;
          cursor:pointer;
          transition:0.2s;
        }

        .sell-btn:hover{
          transform: translateY(-1px);
        }

        .sell-btn:disabled{
          opacity:0.7;
          cursor:not-allowed;
          transform:none;
        }

        .back-btn{
          background: rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.15);
          color:white;
          padding:12px;
          border-radius:14px;
          font-size:13px;
          cursor:pointer;
        }

        /* MOBILE */
        @media (max-width: 520px){
          .sell-card{
            padding:16px;
            border-radius:20px;
          }
          .sell-title{
            font-size:22px;
          }
          .preview-name{
            max-width:180px;
          }
        }
        `}
      </style>
    </div>
  );
};

export default CreateListing;
