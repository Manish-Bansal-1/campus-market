import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

const Register = () => {
  const [name, setName] = useState(""); // required
  const [username, setUsername] = useState(""); // required unique
  const [password, setPassword] = useState(""); // required

  // optional
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    if (!username.trim()) {
      alert("Username is required");
      return;
    }
    if (username.includes(" ")) {
      alert("Username cannot contain spaces");
      return;
    }
    if (!password) {
      alert("Password is required");
      return;
    }

    try {
      setLoading(true);

      await API.post("/auth/register", {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password,
        year,
        gender,
      });

      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
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
          Create Account ✨
        </h2>

        <p style={{ margin: "6px 0 0", color: "#cbd5e1", fontSize: "13px" }}>
          Join your campus marketplace in seconds
        </p>

        <form
          onSubmit={handleRegister}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Full Name (required)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Username (unique, required)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={selectStyle}
            >
              <option value="">Year (optional)</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={selectStyle}
            >
              <option value="">Gender (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="not_preferred">Not Preferred</option>
            </select>
          </div>

          <input
            type="password"
            placeholder="Password (required)"
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
                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "900",
              letterSpacing: "0.3px",
            }}
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "14px", color: "#cbd5e1" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "white", fontWeight: "900", textDecoration: "none" }}
          >
            Login
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

const selectStyle = {
  flex: 1,
  padding: "12px 12px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  outline: "none",
  fontSize: "14px",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

export default Register;
