import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

const Login = () => {
  const [username, setUsername] = useState(""); // unique username
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      alert("Username is required");
      return;
    }
    if (!password) {
      alert("Password is required");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        username: username.trim().toLowerCase(),
        password,
      });

      // ✅ Save token + user
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login successful!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "18px",
        background: "linear-gradient(180deg, #0f172a, #111827)",
      }}
    >
      <div
        style={{
          width: "420px",
          maxWidth: "100%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "20px",
          padding: "22px",
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "white",
            fontSize: "24px",
            fontWeight: "900",
            letterSpacing: "0.4px",
          }}
        >
          Welcome Back 👋
        </h2>

        <p style={{ margin: "6px 0 0", color: "#cbd5e1", fontSize: "13px" }}>
          Login to continue buying & selling
        </p>

        <form
          onSubmit={handleLogin}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading
                ? "rgba(255,255,255,0.12)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "900",
              letterSpacing: "0.3px",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "14px", color: "#cbd5e1" }}>
          Don’t have an account?{" "}
          <Link
            to="/register"
            style={{ color: "white", fontWeight: "900", textDecoration: "none" }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: "12px 12px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  outline: "none",
  fontSize: "14px",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

export default Login;
