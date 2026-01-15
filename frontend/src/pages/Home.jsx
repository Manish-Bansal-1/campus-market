import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

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
      <div className="marketplace-container">
        {/* ===========================
            HEADER
        =========================== */}
        <div
          className="home-header"
          style={{
            paddingTop: "20px",
            paddingBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              className="home-title"
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: "900",
                color: "white",
                letterSpacing: "0.5px",
              }}
            >
              Campus Marketplace 🏫
            </h1>
            <p
              className="home-subtitle"
              style={{ margin: "6px 0 0", color: "#cbd5e1" }}
            >
              Buy & sell items inside your college
            </p>
          </div>

          {/* ✅ Right side buttons */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {/* ✅ ADMIN BUTTON ONLY */}
            {isAdmin && (
              <button
                onClick={() => navigate("/admin/ads")}
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "900",
                }}
              >
                ⚙️ Admin Panel
              </button>
            )}

            <button
              onClick={() => fetchItems()}
              className="home-refresh"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                padding: "10px 14px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* ===========================
            🔥 PROMOTIONS SECTION (ULTRA SMALL ON MOBILE)
        =========================== */}
        <div
          className="promo-box"
          style={{
            marginTop: "10px",
            marginBottom: "12px",
            background: "linear-gradient(135deg, #1d2b64, #f8cdda)",
            padding: "12px",
            borderRadius: "18px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 className="promo-title" style={{ margin: 0, color: "white" }}>
                🚀 Promotions
              </h2>

              <p
                className="promo-subtitle"
                style={{
                  margin: "4px 0 0",
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                Useful links, channels & campus services
              </p>
            </div>

            <button
              onClick={() => fetchAds()}
              className="promo-refresh"
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.28)",
                color: "white",
                padding: "7px 10px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Body */}
          <div style={{ marginTop: "8px" }}>
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
                {/* ✅ Mobile Slider */}
                <div
                  className="promo-slider"
                  style={{
                    display: "flex",
                    gap: "10px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                    marginTop: "6px",
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {ads.map((ad) => (
                    <div
                      key={ad._id}
                      style={{
                        minWidth: "140px",
                        maxWidth: "140px",
                        background: "rgba(255,255,255,0.14)",
                        border: "1px solid rgba(255,255,255,0.22)",
                        borderRadius: "14px",
                        padding: "8px",
                        backdropFilter: "blur(6px)",
                        scrollSnapAlign: "start",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "900",
                        }}
                      >
                        {ad.title}
                      </h3>

                      {ad.description && (
                        <p
                          style={{
                            margin: "5px 0 0",
                            color: "rgba(255,255,255,0.9)",
                            fontSize: "10px",
                            lineHeight: 1.25,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {ad.description}
                        </p>
                      )}

                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: "8px",
                          background: "white",
                          color: "#1d2b64",
                          padding: "5px 7px",
                          borderRadius: "10px",
                          textDecoration: "none",
                          fontWeight: "900",
                          fontSize: "10px",
                        }}
                      >
                        🔗 Open
                      </a>
                    </div>
                  ))}
                </div>

                {/* ✅ Desktop Grid */}
                <div
                  className="promo-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "14px",
                    marginTop: "12px",
                    alignItems: "stretch",
                  }}
                >
                  {ads.map((ad) => (
                    <div
                      key={ad._id}
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: "16px",
                        padding: "14px",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          color: "white",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                      >
                        {ad.title}
                      </h3>

                      {ad.description && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "rgba(255,255,255,0.9)",
                            fontSize: "13px",
                            lineHeight: 1.4,
                          }}
                        >
                          {ad.description}
                        </p>
                      )}

                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: "12px",
                          background: "white",
                          color: "#1d2b64",
                          padding: "9px 12px",
                          borderRadius: "12px",
                          textDecoration: "none",
                          fontWeight: "bold",
                          fontSize: "13px",
                        }}
                      >
                        🔗 Open Link
                      </a>
                    </div>
                  ))}
                </div>

                {/* ✅ Responsive Hide/Show + ULTRA COMPACT Mobile CSS */}
                <style>
                  {`
                    .promo-slider::-webkit-scrollbar { height: 5px; }
                    .promo-slider::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 999px; }

                    /* Desktop default */
                    .promo-slider { display: none !important; }
                    .promo-grid { display: grid !important; }

                    /* Mobile only */
                    @media (max-width: 768px) {
                      .promo-slider { display: flex !important; }
                      .promo-grid { display: none !important; }

                      /* Promotions super compact */
                      .promo-box {
                        padding: 6px !important;
                        margin-bottom: 10px !important;
                        border-radius: 12px !important;
                      }

                      .promo-title {
                        font-size: 12px !important;
                        font-weight: 900 !important;
                      }

                      /* Hide subtitle on mobile */
                      .promo-subtitle {
                        display: none !important;
                      }

                      .promo-refresh {
                        padding: 4px 7px !important;
                        font-size: 10px !important;
                        border-radius: 8px !important;
                      }

                      /* Header compact */
                      .home-header {
                        padding-top: 12px !important;
                        padding-bottom: 6px !important;
                        gap: 8px !important;
                      }

                      .home-title {
                        font-size: 20px !important;
                        line-height: 1.1 !important;
                      }

                      .home-subtitle {
                        font-size: 12px !important;
                        margin-top: 4px !important;
                      }

                      .home-refresh {
                        padding: 7px 10px !important;
                        font-size: 12px !important;
                        border-radius: 10px !important;
                      }
                    }

                    /* Small laptops */
                    @media (max-width: 1100px) {
                      .promo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    }
                  `}
                </style>
              </>
            )}
          </div>
        </div>

        {/* ===========================
            🛒 ITEMS SECTION
        =========================== */}
        <h2
          style={{
            margin: "0 0 14px",
            color: "white",
            fontSize: "18px",
            fontWeight: "800",
          }}
        >
          🛍️ Latest Listings
        </h2>

        {/* Loading */}
        {loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "18px",
              marginTop: "20px",
            }}
          >
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "18px",
            }}
          >
            {items.map((item) => {
              const isMyItem = item.seller?._id === user.id;

              return (
                <div
                  key={item._id}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "18px",
                    overflow: "hidden",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
                    transition: "0.2s",
                  }}
                >
                  {/* Image */}
                  <div style={{ position: "relative" }}>
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "190px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    {/* Price Badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "12px",
                        background: "rgba(0,0,0,0.65)",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontWeight: "900",
                        fontSize: "14px",
                      }}
                    >
                      ₹{item.price}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "14px" }}>
                    <h3
                      style={{
                        margin: 0,
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "900",
                      }}
                    >
                      {item.title}
                    </h3>

                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#cbd5e1",
                        fontSize: "13px",
                        lineHeight: 1.4,
                        minHeight: "38px",
                      }}
                    >
                      {item.description}
                    </p>

                    <div style={{ marginTop: "10px", color: "#94a3b8" }}>
                      <span style={{ fontSize: "12px" }}>
                        👤 Seller:{" "}
                        <b style={{ color: "white" }}>
                          {item.seller?.name || "User"}
                        </b>
                      </span>
                    </div>

                    {/* WhatsApp info */}
                    {item.whatsappNumber && (
                      <div
                        style={{
                          marginTop: "10px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: "12px",
                          padding: "10px",
                          color: "#e2e8f0",
                          fontSize: "13px",
                        }}
                      >
                        📱 WhatsApp: <b>{item.whatsappNumber}</b>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div
                    style={{
                      padding: "12px 14px 14px",
                      display: "flex",
                      gap: "10px",
                    }}
                  >
                    {isMyItem ? (
                      <button
                        disabled
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.12)",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.18)",
                          padding: "12px",
                          borderRadius: "14px",
                          cursor: "not-allowed",
                          fontWeight: "bold",
                        }}
                      >
                        This is your item
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => startChat(item._id, item.seller?._id)}
                          style={{
                            flex: 1,
                            background:
                              "linear-gradient(135deg, #3498db, #1d4ed8)",
                            color: "white",
                            border: "none",
                            padding: "12px",
                            borderRadius: "14px",
                            cursor: "pointer",
                            fontWeight: "900",
                          }}
                        >
                          💬 Chat
                        </button>

                        {item.whatsappNumber && (
                          <button
                            onClick={() =>
                              openWhatsApp(item.whatsappNumber, item.title)
                            }
                            style={{
                              background:
                                "linear-gradient(135deg, #25D366, #16a34a)",
                              color: "white",
                              border: "none",
                              padding: "12px",
                              borderRadius: "14px",
                              cursor: "pointer",
                              fontWeight: "900",
                            }}
                          >
                            📲 WhatsApp
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
    </div>
  );
};

export default Home;
