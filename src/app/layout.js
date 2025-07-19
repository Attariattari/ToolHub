import { Geist, Geist_Mono } from "next/font/google";
import '@/app/globals.css'
import { ThemeProvider } from "@/context/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PDF ToolsHub - Free Online PDF Tools",
  description:
    "Free online PDF tools for merging, splitting, compressing, and converting PDF files. Fast, secure, and easy to use.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
