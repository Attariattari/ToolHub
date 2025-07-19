import { Geist, Geist_Mono } from "next/font/google";
import '@/app/globals.css'
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SocketIoProvider from "@/context/SocketIoContext";

export default function RootLayout({ children }) {
  return (
    <main>
      <SocketIoProvider>
        <Navbar />
        {children}
        <Footer />
      </SocketIoProvider>
    </main>
  )
}
