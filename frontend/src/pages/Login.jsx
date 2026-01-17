import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { enablePushNotifications } from "../utils/push";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // 🔥 NEW: show push popup after login
  const [showPushPopup, setShowPushPopup] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        username: form.username,
        password: form.password,
      });

      // ✅ save token + user
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // ✅ move user to home first (so navbar + app stable)
      navigate("/");

      // 🔥 After login, show popup only if permission is default
      // (granted = no need, denied = can't show prompt)
      setTimeout(() => {
        if (Notification?.permission === "default") {
          setShowPushPopup(true);
        }
      }, 400);
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePushNow = async () => {
    try {
      setPushLoading(true);
      const ok = await enablePushNotifications();

      if (ok) {
        setShowPushPopup(false);
      }
    } catch (err) {
      console.log("ENABLE PUSH ERROR:", err);
      alert("❌ Notification enable failed (check console)");
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <>
      {/* 🔥 PUSH POPUP AFTER LOGIN */}
      {showPushPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "18px",
              padding: "18px",
              color: "white",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 900 }}>
              🔔 Enable Notifications?
            </div>

            <div
              style={{
                marginTop: "8px",
                opacity: 0.9,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              Get offline alerts for:
              <div style={{ marginTop: "10px" }}>
                ✅ New chat message <br />
                ✅ New listing added <br />
                ✅ Item sold
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              <button
                onClick={handleEnablePushNow}
                disabled={pushLoading}
                style={{
                  flex: 1,
                  background: "rgba(34,197,94,0.18)",
                  border: "1px solid rgba(34,197,94,0.40)",
                  color: "#22c55e",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  cursor: pushLoading ? "not-allowed" : "pointer",
                  fontWeight: 900,
                }}
              >
                {pushLoading ? "⏳ Enabling..." : "Allow"}
              </button>

              <button
                onClick={() => setShowPushPopup(false)}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "white",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Later
              </button>
            </div>

            <div style={{ marginTop: "12px", fontSize: "12px", opacity: 0.7 }}>
              Note: Browser permission popup will appear after you click Allow.
            </div>
          </div>
        </div>
      )}

      {/* LOGIN UI */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px",
          background: "#050b16",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#0b1220",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "18px",
            padding: "18px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "22px", fontWeight: 900 }}>🔐 Login</div>
          <div style={{ marginTop: "6px", opacity: 0.8, fontWeight: 600 }}>
            Welcome back to Campus Market
          </div>

          <div style={{ marginTop: "14px" }}>
            <label style={labelStyle}>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              style={inputStyle}
              autoComplete="username"
              required
            />
          </div>

          <div style={{ marginTop: "12px" }}>
            <label style={labelStyle}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              style={inputStyle}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "16px",
              background: loading
                ? "rgba(255,255,255,0.10)"
                : "rgba(59,130,246,0.18)",
              border: "1px solid rgba(59,130,246,0.35)",
              color: "#60a5fa",
              padding: "11px 12px",
              borderRadius: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 900,
            }}
          >
            {loading ? "⏳ Logging in..." : "Login"}
          </button>

          <div style={{ marginTop: "12px", opacity: 0.85, fontWeight: 600 }}>
            Don’t have an account?{" "}
            <Link
              to="/register"
              style={{ color: "#22c55e", fontWeight: 900 }}
            >
              Register
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

const labelStyle = {
  display: "block",
  fontWeight: 800,
  marginBottom: "6px",
  opacity: 0.9,
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "14px",
  outline: "none",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 700,
};

export default Login;
