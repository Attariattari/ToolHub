"use client"

import { useTheme } from "next-themes"
import { FiSun, FiMoon } from "react-icons/fi"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-9 w-9" />
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center text-foreground"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
    </motion.button>
  )
}
