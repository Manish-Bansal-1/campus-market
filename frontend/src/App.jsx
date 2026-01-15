import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateListing from "./pages/CreateListing";
import Inbox from "./pages/Inbox";
import Chat from "./pages/Chat";
import MyListings from "./pages/MyListings";
import AdminAds from "./pages/AdminAds";

// ✅ Admin Protected Route Component
function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // not admin
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppLayout() {
  const location = useLocation();

  // 🔥 NAVBAR HIDE ON AUTH PAGES
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sell" element={<CreateListing />} />
        <Route path="/messages" element={<Inbox />} />
        <Route path="/chat/:chatId" element={<Chat />} />
        <Route path="/my-listings" element={<MyListings />} />

        {/* ✅ ADMIN ROUTE (protected) */}
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
