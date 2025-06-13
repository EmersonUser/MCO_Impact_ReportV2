// utils/api.js
import axios from "axios";

const api = axios.create({
  // baseURL: 'https://saasimplementationserverdev.azurewebsites.net', // Your API base URL
  baseURL: "https://saasimplementationserverdev.azurewebsites.net",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
