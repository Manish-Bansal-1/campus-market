import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import SEO from "../components/SEO";

// ✅ Push functions
import {
  enablePushNotifications,
  shouldShowPushSuccessPopup,
} from "../utils/push";

const ItemCardSkeleton = () => {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "18px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "190px",
          background: "rgba(255,255,255,0.12)",
          animation: "pulse 1.2s infinite ease-in-out",
        }}
      />

      <div style={{ padding: "14px" }}>
        <div
          style={{
            height: "16px",
            width: "70%",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.12)",
            animation: "pulse 1.2s infinite ease-in-out",
          }}
        />

        <div
          style={{
            marginTop: "10px",
            height: "12px",
            width: "95%",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.10)",
            animation: "pulse 1.2s infinite ease-in-out",
          }}
        />
      </div>

      <div style={{ padding: "12px 14px 14px", display: "flex", gap: "10px" }}>
        <div
          style={{
            flex: 1,
            height: "44px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.12)",
            animation: "pulse 1.2s infinite ease-in-out",
          }}
        />
        <div
          style={{
            width: "110px",
            height: "44px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.12)",
            animation: "pulse 1.2s infinite ease-in-out",
          }}
        />
      </div>
    </div>
  );
};

const Home = () => {
  const [items, setItems] = useState([]);

  // ✅ Promotions
  const [ads, setAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(true);

  // ✅ Items loading/error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Install Button state (PWA)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  const navigate = useNavigate();

  // ✅ logged in user
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ✅ ADMIN CHECK
  const isAdmin = user?.role === "admin";

  // ✅ Fetch items with retry
  const fetchItems = async (retries = 3) => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/items/all");

      if (Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems(res.data.items || []);
      }

      setLoading(false);
    } catch (err) {
      console.error("ITEM FETCH ERROR:", err);

      if (retries > 0) {
        setTimeout(() => fetchItems(retries - 1), 1500);
      } else {
        setLoading(false);
        setError("Server is waking up... Please refresh in 5 seconds 😅");
      }
    }
  };

  // ✅ Fetch promotions
  const fetchAds = async () => {
    try {
      setAdsLoading(true);
      const res = await API.get("/ads");
      setAds(res.data || []);
    } catch (err) {
      console.error("ADS FETCH ERROR:", err.response?.data || err.message);
    } finally {
      setAdsLoading(false);
    }
  };

  // ✅ PWA install event capture
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ✅ Enable push notifications once (and popup only once)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // only auto-enable if permission is not granted yet
    // (if already granted, it will subscribe silently)
    const runPush = async () => {
      const res = await enablePushNotifications(token);

      if (res?.success) {
        // ✅ show popup only first time
        if (shouldShowPushSuccessPopup()) {
          alert("✅ Notifications enabled successfully!");
        }
      }
    };

    runPush();
  }, []);

  useEffect(() => {
    fetchItems();
    fetchAds();
  }, []);

  const startChat = async (itemId, sellerId) => {
    if (!localStorage.getItem("token")) {
      alert("Please login first");
      navigate("/login");
      return;
    }

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

  const openWhatsApp = (whatsappNumber, itemTitle) => {
    if (!whatsappNumber) return;

    const cleanNumber = whatsappNumber.replace(/\s+/g, "").replace("+", "");
    const msg = `Hi! I'm interested in your item: ${itemTitle}`;

    window.open(
      `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice?.outcome === "accepted") {
      console.log("✅ User accepted install");
    } else {
      console.log("❌ User dismissed install");
    }

    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a, #111827)",
        paddingBottom: "40px",
      }}
    >
      {/* ✅ SEO */}
      <SEO
        title="Home"
        description="Browse latest campus listings. Buy & sell items inside your college with chat and notifications."
        url="https://campusmarks.vercel.app/"
      />

      <div className="marketplace-container">
        {/* ===========================
            HEADER
        =========================== */}
        <div className="home-header">
          <div>
            <h1 className="home-title">Campus Marketplace 🏫</h1>
            <p className="home-subtitle">Buy & sell items inside your college</p>
          </div>

          <div className="home-actions">
            {canInstall && (
              <button onClick={handleInstallClick} className="home-install-btn">
                ⬇️ Install App
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => navigate("/admin/ads")}
                className="home-admin-btn"
              >
                ⚙️ Admin
              </button>
            )}

            <button onClick={() => fetchItems()} className="home-refresh-btn">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* ===========================
            🔥 PROMOTIONS SECTION
        =========================== */}
        <div className="promo-box">
          <div className="promo-header">
            <div>
              <h2 className="promo-title">🚀 Promotions</h2>
              <p className="promo-subtitle">
                Discover useful links, channels & campus services
              </p>
            </div>

            <button onClick={() => fetchAds()} className="promo-refresh">
              🔄
            </button>
          </div>

          <div style={{ marginTop: "10px" }}>
            {adsLoading ? (
              <p style={{ color: "white", opacity: 0.9, margin: 0 }}>
                ⏳ Loading promotions...
              </p>
            ) : ads.length === 0 ? (
              <p style={{ color: "white", opacity: 0.9, margin: 0 }}>
                No promotions yet 😅
              </p>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="promo-grid">
                  {ads.map((ad) => (
                    <div key={ad._id} className="promo-card">
                      <h3 className="promo-card-title">{ad.title}</h3>

                      {ad.description && (
                        <p className="promo-card-desc">{ad.description}</p>
                      )}

                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noreferrer"
                        className="promo-open-btn"
                      >
                        🔗 Open Link
                      </a>
                    </div>
                  ))}
                </div>

                {/* Mobile Slider */}
                <div className="promo-slider">
                  {ads.map((ad) => (
                    <div key={ad._id} className="promo-card promo-card-mobile">
                      <h3 className="promo-card-title">{ad.title}</h3>

                      {ad.description && (
                        <p className="promo-card-desc">{ad.description}</p>
                      )}

                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noreferrer"
                        className="promo-open-btn"
                      >
                        🔗 Open
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===========================
            🛒 ITEMS SECTION
        =========================== */}
        <h2 className="items-title">🛍️ Latest Listings</h2>

        {/* Loading */}
        {loading && (
          <div className="items-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            style={{
              background: "rgba(255,0,0,0.08)",
              border: "1px solid rgba(255,0,0,0.25)",
              borderRadius: "16px",
              padding: "18px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#ffb3b3", margin: 0 }}>{error}</p>
            <button
              onClick={() => fetchItems()}
              style={{
                marginTop: "12px",
                padding: "10px 16px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                background: "#3498db",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Refresh Items
            </button>
          </div>
        )}

        {/* Items Grid */}
        {!loading && !error && (
          <div className="items-grid">
            {items.map((item) => {
              const isMyItem = item.seller?._id === user.id;

              return (
                <div key={item._id} className="item-card">
                  {/* Image */}
                  <div style={{ position: "relative" }}>
                    <img src={item.image} alt={item.title} className="item-img" />

                    {/* Price Badge */}
                    <div className="price-badge">₹{item.price}</div>
                  </div>

                  {/* Content */}
                  <div className="item-content">
                    <h3 className="item-title">{item.title}</h3>

                    <p className="item-desc">{item.description}</p>

                    {/* ✅ Premium Seller UI */}
                    <div className="seller-row">
                      <div className="seller-chip">
                        👤{" "}
                        {item.seller?.name || item.seller?.username || "User"}
                      </div>

                      {(item.seller?.year || item.seller?.gender) && (
                        <div className="seller-meta">
                          {item.seller?.year ? `🎓 ${item.seller.year}` : ""}
                          {item.seller?.year && item.seller?.gender ? " • " : ""}
                          {item.seller?.gender ? `⚧️ ${item.seller.gender}` : ""}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="item-actions">
                    {isMyItem ? (
                      <button className="btn-disabled" disabled>
                        Your item
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => startChat(item._id, item.seller?._id)}
                          className="btn-chat"
                        >
                          💬 Chat
                        </button>

                        {item.whatsappNumber && (
                          <button
                            onClick={() =>
                              openWhatsApp(item.whatsappNumber, item.title)
                            }
                            className="btn-wa"
                          >
                            📲
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===========================
          CSS
      =========================== */}
      <style>
        {`
          /* HEADER */
          .home-header{
            display:flex;
            justify-content:space-between;
            align-items:flex-end;
            gap:12px;
            flex-wrap:wrap;
            padding-top:14px;
            padding-bottom:10px;
          }

          .home-title{
            margin:0;
            font-size:28px;
            font-weight:900;
            color:white;
            letter-spacing:0.5px;
          }

          .home-subtitle{
            margin:6px 0 0;
            color:#cbd5e1;
            font-size:14px;
          }

          .home-actions{
            display:flex;
            gap:10px;
            flex-wrap:wrap;
          }

          .home-install-btn{
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border: 1px solid rgba(255,255,255,0.18);
            color: white;
            padding: 10px 14px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 900;
          }

          .home-admin-btn{
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            border: 1px solid rgba(255,255,255,0.18);
            color: white;
            padding: 10px 14px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 900;
          }

          .home-refresh-btn{
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            color: white;
            padding: 10px 14px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: bold;
          }

          /* PROMOTIONS */
          .promo-box{
            margin-top: 12px;
            margin-bottom: 18px;
            background: linear-gradient(135deg, #1d2b64, #f8cdda);
            padding: 16px;
            border-radius: 18px;
            box-shadow: 0 12px 28px rgba(0,0,0,0.35);
          }

          .promo-header{
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
          }

          .promo-title{
            margin:0;
            font-size:18px;
            color:white;
            font-weight:900;
          }

          .promo-subtitle{
            margin:6px 0 0;
            color: rgba(255,255,255,0.9);
            font-size:13px;
          }

          .promo-refresh{
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 9px 12px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 900;
          }

          .promo-grid{
            display:grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap:14px;
            margin-top:12px;
          }

          .promo-slider{
            display:none;
          }

          .promo-card{
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 16px;
            padding: 14px;
            backdrop-filter: blur(6px);
          }

          .promo-card-title{
            margin:0;
            color:white;
            font-size:16px;
            font-weight:900;
          }

          .promo-card-desc{
            margin:8px 0 0;
            color: rgba(255,255,255,0.9);
            font-size:13px;
            line-height:1.4;
          }

          .promo-open-btn{
            display:inline-block;
            margin-top:12px;
            background:white;
            color:#1d2b64;
            padding:9px 12px;
            border-radius:12px;
            text-decoration:none;
            font-weight:900;
            font-size:13px;
          }

          /* ITEMS */
          .items-title{
            margin: 0 0 14px;
            color:white;
            font-size:18px;
            font-weight:900;
          }

          .items-grid{
            display:grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap:18px;
          }

          .item-card{
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 10px 20px rgba(0,0,0,0.25);
            transition: 0.2s;
          }

          .item-img{
            width:100%;
            height:190px;
            object-fit:cover;
            display:block;
          }

          .price-badge{
            position:absolute;
            bottom:12px;
            left:12px;
            background: rgba(0,0,0,0.65);
            color:white;
            padding:6px 10px;
            border-radius:999px;
            font-weight:900;
            font-size:14px;
          }

          .item-content{
            padding:14px;
          }

          .item-title{
            margin:0;
            color:white;
            font-size:16px;
            font-weight:900;
          }

          .item-desc{
            margin:8px 0 0;
            color:#cbd5e1;
            font-size:13px;
            line-height:1.4;
            min-height:38px;
          }

          /* SELLER PREMIUM */
          .seller-row{
            margin-top:10px;
            display:flex;
            flex-wrap:wrap;
            gap:8px;
            align-items:center;
          }

          .seller-chip{
            background: rgba(255,255,255,0.10);
            border: 1px solid rgba(255,255,255,0.14);
            padding: 6px 10px;
            border-radius: 999px;
            color: white;
            font-size: 12px;
            font-weight: 800;
          }

          .seller-meta{
            color: rgba(255,255,255,0.75);
            font-size: 12px;
            font-weight: 700;
          }

          .item-actions{
            padding: 12px 14px 14px;
            display:flex;
            gap:10px;
          }

          .btn-disabled{
            width:100%;
            background: rgba(255,255,255,0.12);
            color:white;
            border: 1px solid rgba(255,255,255,0.18);
            padding: 12px;
            border-radius: 14px;
            cursor: not-allowed;
            font-weight:900;
          }

          .btn-chat{
            flex:1;
            background: linear-gradient(135deg, #3498db, #1d4ed8);
            color:white;
            border:none;
            padding: 12px;
            border-radius: 14px;
            cursor:pointer;
            font-weight:900;
          }

          .btn-wa{
            width:52px;
            background: linear-gradient(135deg, #25D366, #16a34a);
            color:white;
            border:none;
            padding: 12px;
            border-radius: 14px;
            cursor:pointer;
            font-weight:900;
          }

          /* ===== MOBILE PREMIUM ===== */
          @media (max-width: 768px){
            .home-title{
              font-size:20px;
              line-height:1.1;
            }

            .home-subtitle{
              font-size:12px;
              margin-top:4px;
            }

            .home-actions{
              width:100%;
              justify-content:space-between;
            }

            .home-refresh-btn, .home-admin-btn, .home-install-btn{
              padding:8px 10px;
              border-radius:10px;
              font-size:12px;
            }

            .promo-box{
              padding:10px;
              border-radius:16px;
              margin-bottom:14px;
            }

            .promo-title{
              font-size:14px;
            }

            .promo-subtitle{
              display:none;
            }

            .promo-refresh{
              padding:6px 10px;
              border-radius:10px;
              font-size:12px;
            }

            .promo-grid{
              display:none;
            }

            .promo-slider{
              display:flex;
              gap:10px;
              overflow-x:auto;
              padding-bottom:6px;
              margin-top:10px;
              scroll-snap-type:x mandatory;
            }

            .promo-slider::-webkit-scrollbar{
              display:none;
            }

            .promo-card-mobile{
              min-width: 155px;
              max-width: 155px;
              padding: 10px;
              scroll-snap-align:start;
            }

            .promo-card-title{
              font-size:13px;
            }

            .promo-card-desc{
              font-size:11px;
              line-height:1.3;
            }

            .promo-open-btn{
              padding:6px 8px;
              font-size:11px;
              border-radius:10px;
            }

            /* ✅ MOBILE 1 CARD PER ROW */
            .items-grid{
              grid-template-columns: 1fr;
              gap:14px;
            }

            .item-img{
              height:160px;
            }

            .item-content{
              padding:10px;
            }

            .item-title{
              font-size:15px;
              font-weight:900;
            }

            .item-desc{
              font-size:13px;
              line-height:1.35;
              min-height:auto;
            }

            .price-badge{
              font-size:12px;
              padding:5px 8px;
              bottom:8px;
              left:8px;
            }

            .seller-chip{
              font-size:11px;
              padding:5px 9px;
            }

            .seller-meta{
              font-size:11px;
            }

            .item-actions{
              padding: 10px;
              gap:8px;
            }

            .btn-chat{
              padding:10px;
              border-radius:12px;
              font-size:12px;
            }

            .btn-wa{
              width:42px;
              padding:10px;
              border-radius:12px;
              font-size:12px;
            }

            .btn-disabled{
              padding:10px;
              border-radius:12px;
              font-size:12px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Home;
