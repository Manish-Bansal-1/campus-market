import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// ✅ socket outside component (important)
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

  // ✅ join user room for socket updates
  useEffect(() => {
    if (user?.id) socket.emit("joinUser", user.id);
  }, [user?.id]);

  // 1st load + whenever token changes
  useEffect(() => {
    fetchUnreadCount();
    // eslint-disable-next-line
  }, [token]);

  // 🔔 live unread update
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
    navigate("/login");
  };

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

      {/* NAVBAR */}
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
          {/* LOGO */}
          <div
            style={{ color: "white", fontWeight: 900, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Campus Market
          </div>

          {/* MENU BUTTON + BADGE */}
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
            aria-label="Toggle menu"
          >
            ☰

            {/* 🔥 Badge on menu icon */}
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 6px",
                  borderRadius: "999px",
                  background: "#ef4444",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0b1220",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* MENU LINKS */}
        {menuOpen && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <Link to="/" onClick={() => setMenuOpen(false)} style={linkStyle}>
              🏠 Home
            </Link>

            <Link to="/sell" onClick={() => setMenuOpen(false)} style={linkStyle}>
              ➕ Sell Item
            </Link>

            <Link to="/chats" onClick={() => setMenuOpen(false)} style={linkStyle}>
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
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {!token ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  style={linkStyle}
                >
                  🔐 Login
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  style={linkStyle}
                >
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

export default Navbar;
