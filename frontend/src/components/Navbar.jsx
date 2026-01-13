import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // 🔔 FETCH UNREAD COUNT
  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const res = await API.get("/chats/unread-count", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        console.error(
          "Unread fetch error:",
          err.response?.data || err.message
        );

        // if token expired
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          setUnreadCount(0);
        }
      }
    };

    fetchUnread();
  }, [token]);

  return (
    <div style={styles.nav}>
      <div style={styles.logo} onClick={() => navigate("/")}>
        Campus Market
      </div>

      <div style={styles.links}>
        <Link style={styles.link} to="/">
          Home
        </Link>

        {token && (
          <Link style={styles.link} to="/sell">
            Sell Item
          </Link>
        )}

        {token && (
          <Link style={styles.link} to="/messages">
            Messages
            {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
          </Link>
        )}

        {token && (
          <Link style={styles.link} to="/my-listings">
            My Listings
          </Link>
        )}

        {token ? (
          <button style={styles.logout} onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link style={styles.link} to="/login">
            Login
          </Link>
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
