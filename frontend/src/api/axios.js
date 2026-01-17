import axios from "axios";

const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ✅ ensure /api always present
const baseURL = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

const API = axios.create({
  baseURL,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
