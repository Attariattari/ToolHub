import { Geist, Geist_Mono } from "next/font/google";
import '@/app/globals.css'
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ToastContainer } from "react-toastify";
import { Suspense } from "react";

export default function RootLayout({ children }) {
  return (
    <main>
      <Suspense fallback={<div></div>}>
        <Navbar />
        {children}
        <Footer />
        <ToastContainer />
      </Suspense>
    </main>
  )
}
