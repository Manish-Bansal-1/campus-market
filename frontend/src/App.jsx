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

import { enablePushNotifications } from "./utils/push";

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

  // ✅ AUTO ENABLE PUSH AFTER LOGIN
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // If permission already granted, it will NOT show popup
    // It will just save subscription to server silently
    enablePushNotifications();
  }, []);

  const hideNavbar =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/sell" element={<CreateListing />} />
        <Route path="/chats" element={<Inbox />} />
        <Route path="/chat/:chatId" element={<Chat />} />
        <Route path="/mylistings" element={<MyListings />} />

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
