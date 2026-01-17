import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateListing from "./pages/CreateListing";
import Inbox from "./pages/Inbox";
import Chat from "./pages/Chat";
import MyListings from "./pages/MyListings";
import AdminAds from "./pages/AdminAds";

import { registerPush } from "./utils/push";

// ✅ Admin Protected Route Component
function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  return children;
}

function AppLayout() {
  const location = useLocation();

  // ✅ PUSH REGISTER (1 time)
  useEffect(() => {
    registerPush();
  }, []);

  // 🔥 NAVBAR HIDE ON AUTH PAGES
  const hideNavbar =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ SELL PAGE */}
        <Route path="/sell" element={<CreateListing />} />

        {/* ✅ CHATS LIST PAGE */}
        <Route path="/chats" element={<Inbox />} />

        {/* ✅ SINGLE CHAT PAGE */}
        <Route path="/chat/:chatId" element={<Chat />} />

        {/* ✅ MY LISTINGS */}
        <Route path="/mylistings" element={<MyListings />} />

        {/* ✅ ADMIN ROUTE */}
        <Route
          path="/admin/ads"
          element={
            <AdminRoute>
              <AdminAds />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
