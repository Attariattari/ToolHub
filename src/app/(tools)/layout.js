import { Geist, Geist_Mono } from "next/font/google";
import '@/app/globals.css'
import Navbar from "@/components/layout/Navbar";
import SocketIoProvider from "@/context/SocketIoContext";

export default function RootLayout({ children }) {
  return (
    <main>
      <SocketIoProvider>
        <Navbar className='px-4 md:px-12' />
        {children}
      </SocketIoProvider>
    </main>
  )
}
