"use client"

import Sidebar from "@/components/user/Sidebar"
import "../globals.css"
import Navbar from "@/components/layout/Navbar"
import SocketIoProvider from "@/context/SocketIoContext"

export default function UserLayout({ children }) {

  return (
    <div className="flex flex-col min-h-screen">
      <SocketIoProvider>
        <Navbar className='px-4 md:px-8' />
        <div>
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 md:ml-64">
            {children}
          </div>
        </div>
      </SocketIoProvider>
    </div>
  )
}
