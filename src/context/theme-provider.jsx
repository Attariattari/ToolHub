"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import React from "react"

export function ThemeProvider({ children, ...props }) {
  return <NextThemeProvider {...props}>{children}</NextThemeProvider>
}

export const ThemeContext = React.createContext({
  theme: undefined,
  setTheme: () => null,
})

export const ThemeContextProvider = ({ children }) => {
  const [theme, setTheme] = React.useState(undefined)

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system"
    setTheme(savedTheme)
  }, [])

  React.useEffect(() => {
    if (theme) {
      localStorage.setItem("theme", theme)

      if (
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => React.useContext(ThemeContext)
