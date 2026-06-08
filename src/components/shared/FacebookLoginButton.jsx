"use client";
import React from "react";

const FacebookLoginButton = ({ isLoading }) => {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI;
    // const redirectUri = "https://e070e60b7ded.ngrok-free.app/auth/facebook-callback";
    const scope = "email,public_profile";

    // OAuth URL generate
    const fbLoginUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&response_type=code`;

    // Open popup / redirect
    window.location.href = fbLoginUrl;
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-1 py-3 border border-gray-300 bg-gray-50 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
      Facebook
    </button>
  );
};

export default FacebookLoginButton;
