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
        console.error("Unread fetch error:", err.response?.data || err.message);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          setUnreadCount(0);
        }
      }
    };

    fetchUnread();
  }, [token]);

  return (
    <div className="navbar">
      <div className="navbar-logo" onClick={() => navigate("/")}>
        Campus Market
      </div>

      <div className="navbar-links">
        <Link className="nav-link" to="/">
          Home
        </Link>

        {token && (
          <Link className="nav-link" to="/sell">
            Sell Item
          </Link>
        )}

        {token && (
          <Link className="nav-link" to="/messages">
            Messages
            {unreadCount > 0 && (
              <span className="nav-badge">{unreadCount}</span>
            )}
          </Link>
        )}

        {token && (
          <Link className="nav-link" to="/my-listings">
            My Listings
          </Link>
        )}

        {token ? (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link className="nav-link" to="/login">
            Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
