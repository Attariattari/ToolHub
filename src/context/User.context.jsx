"use client";
import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import Api from "@/utils/Api";
import { useRouter } from "next/navigation";

// Create the context
const UserContext = createContext();

// Create a provider component
const UserProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data using the Api instance
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await Api.get("/users/me");
      setUser(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const reFetchUser = async () => {
    try {
      const response = await Api.get("/users/me");
      setUser(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user data");
    }
  };

  const logout = async () => {
    try {
      const response = await Api.post("/users/logout");
      toast.success(response.data.message || "User Logout Successfully");
      setUser(null);
      window.location.href = "/";
    } catch (err) {
      if (err.response.data.message === "jwt expired") {
        setUser(null);
        toast.success("User Logout Successfully");
        router.push("/");
        return;
      }
      toast.error(error?.response?.data?.message || "Logout failed");
      setError(err.response?.data?.message || "Logout failed");
    }
  };

  // New API functions
  const updateProfile = async (profileData) => {
    try {
      const response = await Api.patch("/users/update-profile", profileData);
      setUser(response.data.data);
      toast.success(response.data.message || "Profile updated successfully!");
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateEmail = async (newEmail) => {
    try {
      const response = await Api.put("/users/update-email", { newEmail });
      setUser(response.data.data);
      toast.success(response.data.message || "Email updated successfully!");
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update email";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await Api.post("/users/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success(response.data.message || "Password changed successfully!");
      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to change password";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const setupTwoFactorAuth = async (enabled) => {
    try {
      const response = await Api.post("/users/setup-2fa", { enabled });
      await reFetchUser(); // Refresh user data
      toast.success(
        response.data.message ||
          `2FA ${enabled ? "enabled" : "disabled"} successfully!`
      );
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to setup 2FA";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        reFetchUser,
        logout,
        updateProfile,
        updateEmail,
        changePassword,
        setupTwoFactorAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };

// 'use client'
// import React, { createContext, useState, useEffect } from "react";
// import { toast } from "react-toastify";
// import Api from "@/utils/Api";
// import { useRouter } from "next/navigation";

// // Create the context
// const UserContext = createContext();

// // Create a provider component
// const UserProvider = ({ children }) => {
//   const router = useRouter();
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch user data using the Api instance
//   const fetchUser = async () => {
//     try {
//       setLoading(true);
//       const response = await Api.get("/users/me");
//       setUser(response.data.data);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to fetch user data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   const reFetchUser = async () => {
//     try {
//       const response = await Api.get("/users/me");
//       setUser(response.data.data);
//     } catch (err) {
//       // router.push("/auth/login");
//       setError(err.response?.data?.message || "Failed to fetch user data");
//     }
//   };

//   const logout = async () => {
//     try {
//       const response = await Api.post("/users/logout");

//       toast.success(response.data.message || "User Logout Successfully");
//       setUser(null);
//       window.location.href = "/"
//       // router.push("/");
//     } catch (err) {
//       if (err.response.data.message === "jwt expired") {
//         setUser(null);
//         toast.success("User Logout Successfully");
//         // window.history.replaceState({}, "", "/");
//         router.push("/");
//         return;
//       }
//       toast.error(error?.response?.data?.message || "Logout failed");
//       setError(err.response?.data?.message || "Logout failed");
//     }
//   };

//   return (
//     <UserContext.Provider
//       value={{ user, loading, error, reFetchUser, logout }}
//     >
//       {children}
//     </UserContext.Provider>
//   );
// };

// export { UserContext, UserProvider };
