import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import MyListings from "./pages/MyListings";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateListing from "./pages/CreateListing";
import Inbox from "./pages/Inbox";
import Chat from "./pages/Chat";

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
