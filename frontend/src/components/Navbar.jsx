import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import API from "../api/axios";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ hide navbar on scroll down (mobile)
  const [hideNav, setHideNav] = useState(false);
  const lastScrollY = useRef(0);

  // ✅ click outside
  const navRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    setMenuOpen(false);
    navigate("/login");
  };

  // 🔔 fetch unread
  const fetchUnread = async () => {
    if (!token) return;
    try {
      const res = await API.get("/chats/unread-count");
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Unread fetch error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [token]);

  // 🔥 LIVE unread update via socket
  useEffect(() => {
    if (!token) return;

    const handler = () => fetchUnread();
    socket.on("unreadUpdate", handler);

    return () => socket.off("unreadUpdate", handler);
  }, [token]);

  // ✅ Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // ✅ Hide navbar on scroll down ONLY MOBILE
  useEffect(() => {
    const handleScroll = () => {
      // if menu open, keep navbar visible
      if (menuOpen) return;

      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      // only work on mobile width
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // small scroll ignore
        if (Math.abs(diff) < 10) return;

        if (diff > 0 && currentY > 80) {
          // scrolling down
          setHideNav(true);
        } else {
          // scrolling up
          setHideNav(false);
        }
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  return (
    <>
      {/* ✅ Overlay blur when menu open */}
      {menuOpen && (
        <div
          className="nav-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      <div className={`navbar ${hideNav ? "hide" : ""}`} ref={navRef}>
        <div className="navbar-inner">
          <div className="navbar-left">
            <div
              className="navbar-logo"
              onClick={() => {
                setMenuOpen(false);
                navigate("/");
              }}
            >
              Campus Market
            </div>

            {/* 🍔 Mobile toggle */}
            <button
              className="navbar-toggle"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? "✖" : "☰"}
            </button>
          </div>

          {/* Links */}
          <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
            <Link className="nav-link" to="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>

            {token && (
              <Link
                className="nav-link"
                to="/sell"
                onClick={() => setMenuOpen(false)}
              >
                Sell Item
              </Link>
            )}

            {token && (
              <Link
                className="nav-link"
                to="/messages"
                onClick={() => setMenuOpen(false)}
              >
                Messages
                {unreadCount > 0 && (
                  <span className="nav-badge">{unreadCount}</span>
                )}
              </Link>
            )}

            {token && (
              <Link
                className="nav-link"
                to="/my-listings"
                onClick={() => setMenuOpen(false)}
              >
                My Listings
              </Link>
            )}

            {token ? (
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <Link
                className="nav-link"
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
