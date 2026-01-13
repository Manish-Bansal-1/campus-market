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

  const handleLogout = () => {
    localStorage.clear();
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
      fetchUnread(); // refresh count instantly
    };

    socket.on("unreadUpdate", handler);

    return () => {
      socket.off("unreadUpdate", handler);
    };
  }, [token]);

  return (
    <div style={styles.nav}>
      <div style={styles.logo} onClick={() => navigate("/")}>
        Campus Market
      </div>

      <div style={styles.links}>
        <Link style={styles.link} to="/">Home</Link>

        {token && <Link style={styles.link} to="/sell">Sell Item</Link>}

        {token && (
          <Link style={styles.link} to="/messages">
            Messages
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </Link>
        )}

        {token && <Link style={styles.link} to="/my-listings">My Listings</Link>}

        {token ? (
          <button style={styles.logout} onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link style={styles.link} to="/login">Login</Link>
        )}
      </div>
    </div>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 30px",
    background: "#2c3e50",
    color: "white",
  },
  logo: {
    fontWeight: "bold",
    cursor: "pointer",
  },
  links: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },
  link: {
    color: "white",
    textDecoration: "none",
    position: "relative",
  },
  badge: {
    background: "red",
    color: "white",
    borderRadius: "50%",
    padding: "2px 7px",
    fontSize: "12px",
    marginLeft: "6px",
  },
  logout: {
    background: "transparent",
    border: "1px solid red",
    color: "red",
    cursor: "pointer",
    padding: "5px 10px",
  },
};

export default Navbar;
