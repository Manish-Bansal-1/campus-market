import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

  const handleLogout = () => {
    localStorage.clear();
    setMenuOpen(false);
    navigate("/login");
  };

  // 🔔 function to fetch unread count
  const fetchUnread = async () => {
    if (!token) return;
    try {
      const res = await API.get("/chats/unread-count");
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Unread fetch error:", err.response?.data || err.message);
    }
  };

  // ✅ On load unread fetch
  useEffect(() => {
    fetchUnread();
  }, [token]);

  // 🔥 LIVE unread update via socket
  useEffect(() => {
    if (!token) return;

    const handler = () => {
      fetchUnread();
    };

    socket.on("unreadUpdate", handler);

    return () => {
      socket.off("unreadUpdate", handler);
    };
  }, [token]);

  return (
    <div className="navbar">
      <div className="navbar-top">
        <div className="navbar-logo" onClick={() => navigate("/")}>
          Campus Market
        </div>

        {/* 🍔 Mobile menu button */}
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
          <Link className="nav-link" to="/sell" onClick={() => setMenuOpen(false)}>
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
          <Link className="nav-link" to="/login" onClick={() => setMenuOpen(false)}>
            Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
