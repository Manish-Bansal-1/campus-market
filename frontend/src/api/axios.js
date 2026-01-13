import axios from "axios";

console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  console.log("AXIOS REQUEST =>", config.method?.toUpperCase(), config.baseURL + config.url);

  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
