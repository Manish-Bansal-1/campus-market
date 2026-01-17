import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import SEO from "../components/SEO";

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

const formatTime = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const Home = () => {
  const [items, setItems] = useState([]);

  // ✅ Promotions
  const [ads, setAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(true);

  // ✅ Items loading/error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ✅ logged in user
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ✅ ADMIN CHECK
  const isAdmin = user?.role === "admin";

  // ============================
  // ✅ PWA Install Button Logic
  // ============================
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIos = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  };

  const isInStandaloneMode = () => {
    // iOS Safari: navigator.standalone
    // Android/Chrome: matchMedia display-mode
    return (
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  };

  useEffect(() => {
    // If already installed -> hide button
    if (isInStandaloneMode()) {
      setShowInstall(false);
      return;
    }

    const handler = (e) => {
      // Stop Chrome mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If app gets installed -> hide button
    const installedHandler = () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", installedHandler);

    // iOS doesn't support beforeinstallprompt
    // But we can still show a clean button for iOS users
    if (isIos() && !isInStandaloneMode()) {
      setShowInstall(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    // iOS -> show guide
    if (isIos()) {
      setShowIosGuide(true);
      return;
    }

    // Android/Desktop -> show native install popup
    if (!deferredPrompt) {
      alert("Install option not available right now 😅");
      return;
    }

    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice?.outcome === "accepted") {
        setShowInstall(false);
      }

      setDeferredPrompt(null);
    } catch (err) {
      console.log("INSTALL ERROR:", err.message);
    }
  };

  // ============================
  // ✅ Fetch items with retry
  // ============================
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
            {/* ✅ Install App Button (clean + only when possible) */}
            {showInstall && (
              <button onClick={handleInstallClick} className="home-install-btn">
                ⬇ Install App
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
          iOS Guide Modal (clean)
      =========================== */}
      {showIosGuide && (
        <div
          onClick={() => setShowIosGuide(false)}
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
              📲 Install on iPhone
            </h2>

            <p
              style={{
                marginTop: "10px",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              iPhone Safari me direct install popup nahi aata 😅
              <br />
              Install karne ke liye:
              <br />
              <b>Share</b> button dabao → <b>Add to Home Screen</b>
            </p>

            <button
              onClick={() => setShowIosGuide(false)}
              style={{
                marginTop: "14px",
                width: "100%",
                padding: "12px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                fontWeight: 900,
                color: "white",
                background: "rgba(59,130,246,0.9)",
              }}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* ===========================
          MOBILE PREMIUM CSS
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
            align-items:center;
          }

          .home-install-btn{
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border: 1px solid rgba(255,255,255,0.18);
            color: white;
            padding: 10px 14px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 900;
            box-shadow: 0 10px 18px rgba(0,0,0,0.25);
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
