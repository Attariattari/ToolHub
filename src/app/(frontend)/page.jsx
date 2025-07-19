"use client"

import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import Hero from "@/components/sections/Hero"
import HowItWorks from "@/components/sections/HowItWorks"
import LatestNews from "@/components/sections/LatestNews"
import ToolsShowcase from "@/components/sections/ToolsShowcase"
import WhyChooseUs from "@/components/sections/WhyChooseUs"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      <Hero />
      <ToolsShowcase />
      <WhyChooseUs />
      <HowItWorks />
      <LatestNews />
    </div>
  )
}
