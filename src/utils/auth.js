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

