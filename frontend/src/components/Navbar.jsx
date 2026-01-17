import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// ✅ socket outside component
const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

const Navbar = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hideNav, setHideNav] = useState(false);

  const lastScrollY = useRef(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // ✅ Join user room (for unread updates)
  useEffect(() => {
    if (user?.id) socket.emit("joinUser", user.id);
  }, [user?.id]);

  // ✅ Fetch unread count
  const fetchUnreadCount = async () => {
    if (!token) return;

    try {
      const res = await API.get("/chats/unread-count");
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.log("Unread count error:", err.response?.data || err.message);
    }
  };

  // first load
  useEffect(() => {
    fetchUnreadCount();
  }, [token]);

  // 🔔 live update
  useEffect(() => {
    if (!token) return;

    const handler = () => {
      fetchUnreadCount();
    };

    socket.on("unreadUpdate", handler);
    return () => socket.off("unreadUpdate", handler);
  }, [token]);

  // ✅ Hide navbar on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY > lastScrollY.current && currentY > 80) setHideNav(true);
      else setHideNav(false);

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUnreadCount(0);
    setMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Overlay */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 50,
          }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        style={{
          position: "sticky",
          top: hideNav ? "-90px" : "0px",
          zIndex: 60,
          transition: "0.25s ease",
          background: "#0b1220",
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          {/* Logo */}
          <div
            style={{ color: "white", fontWeight: 900, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Campus Market
          </div>

          {/* Desktop Links */}
          <div className="nav-desktop">
            <Link to="/" style={desktopLinkStyle}>
              🏠 Home
            </Link>

            <Link to="/sell" style={desktopLinkStyle}>
              ➕ Sell Item
            </Link>

            {/* ✅ My Listings back */}
            {token && (
              <Link to="/mylistings" style={desktopLinkStyle}>
                📦 My Listings
              </Link>
            )}

            <Link to="/chats" style={desktopLinkStyle}>
              💬 Messages
              {unreadCount > 0 && (
                <span style={badgeStyle}>{unreadCount}</span>
              )}
            </Link>

            {!token ? (
              <>
                <Link to="/login" style={desktopLinkStyle}>
                  🔐 Login
                </Link>
                <Link to="/register" style={desktopLinkStyle}>
                  ✨ Register
                </Link>
              </>
            ) : (
              <button onClick={logout} style={logoutDesktopBtn}>
                Logout
              </button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen((p) => !p)}
            style={{
              position: "relative",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.16)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: 900,
            }}
            className="nav-hamburger"
            aria-label="Toggle menu"
          >
            ☰

            {/* ✅ Badge on hamburger icon */}
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "#ef4444",
                  color: "white",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 900,
                  padding: "2px 7px",
                  border: "2px solid #0b1220",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
            className="nav-mobile"
          >
            <Link to="/" onClick={closeMenu} style={linkStyle}>
              🏠 Home
            </Link>

            <Link to="/sell" onClick={closeMenu} style={linkStyle}>
              ➕ Sell Item
            </Link>

            {/* ✅ My Listings back */}
            {token && (
              <Link to="/mylistings" onClick={closeMenu} style={linkStyle}>
                📦 My Listings
              </Link>
            )}

            <Link to="/chats" onClick={closeMenu} style={linkStyle}>
              💬 Messages{" "}
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    background: "#ef4444",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 900,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>

            {!token ? (
              <>
                <Link to="/login" onClick={closeMenu} style={linkStyle}>
                  🔐 Login
                </Link>
                <Link to="/register" onClick={closeMenu} style={linkStyle}>
                  ✨ Register
                </Link>
              </>
            ) : (
              <button
                onClick={logout}
                style={{
                  background: "rgba(239,68,68,0.14)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#ff6b6b",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: 900,
                  textAlign: "left",
                }}
              >
                Logout
              </button>
            )}
          </div>
        )}

        {/* CSS for Desktop/Mobile */}
        <style>{`
          .nav-desktop{
            display: none;
            align-items: center;
            gap: 12px;
          }

          .nav-hamburger{
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          /* Desktop */
          @media (min-width: 900px){
            .nav-desktop{
              display: flex;
            }
            .nav-hamburger{
              display: none;
            }
            .nav-mobile{
              display: none;
            }
          }
        `}</style>
      </div>
    </>
  );
};

const linkStyle = {
  color: "white",
  fontWeight: 800,
  textDecoration: "none",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "10px 12px",
  borderRadius: "12px",
};

const desktopLinkStyle = {
  color: "white",
  fontWeight: 800,
  textDecoration: "none",
  padding: "8px 10px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const badgeStyle = {
  marginLeft: "8px",
  background: "#ef4444",
  color: "white",
  padding: "2px 8px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 900,
};

const logoutDesktopBtn = {
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#ff6b6b",
  padding: "8px 10px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: 900,
};

export default Navbar;
