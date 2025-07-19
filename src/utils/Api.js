import axios from "axios";
import { BACKEND_URL } from "./apiUrl.js";

const Api = axios.create({
  baseURL: `${BACKEND_URL}/api/v1/`,
  withCredentials: true
});

// Attach a token to each request
Api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['accept-language'] = localStorage.getItem("language") || "en";
    
    // Add device ID header
    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) {
      config.headers['x-device-id'] = deviceId;
    }
    
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

// Add a response interceptor with retry logic
Api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const config = error.config;

    // Check if the error is a server error and not already retried
    if (
      error.response &&
      error.response.status === 500 &&
      !config._retry // Avoid infinite retry loops
    ) {
      config._retry = true; // Mark the request as retried
      try {
        return await Api(config); // Retry the request
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    // Redirect on unauthorized or forbidden errors
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem('accessToken');
      if (!window.location.pathname.includes('/auth/')) {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error); // Pass other errors to the caller
  }
);

export default Api;