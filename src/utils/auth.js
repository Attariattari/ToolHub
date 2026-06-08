// utils/auth.js
import Cookies from "js-cookie";

// ✅ Client-side: read cookies via js-cookie
export const getClientToken = () => {
  if (typeof window === "undefined") return null; // SSR safety
  return Cookies.get("accessToken") || Cookies.get("refreshToken") || null;
};

// ✅ Server-side: read cookies via next/headers
export const getServerToken = (cookies) => {
  // next/headers ka cookies() object pass karna hoga
  return cookies.get("accessToken")?.value || cookies.get("refreshToken")?.value || null;
};


// Utility function to sync localStorage token with cookies
export const syncTokenWithCookies = () => {
  const token = localStorage.getItem("accessToken")
  if (token) {
    document.cookie = `accessToken=${token}; path=/`
  }
}

// Function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken")
}

// Function to handle logout
export const logout = () => {
  localStorage.removeItem("accessToken")
  document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
}

