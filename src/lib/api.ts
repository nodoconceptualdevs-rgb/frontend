import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
