"use client"

import { HeroSection } from "@/components/landing/HeroSection"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { ResourcesSection } from "@/components/landing/ResourcesSection"

export default function Home() {
  return (
    <main
      className="
        relative
        min-h-screen
        overflow-x-hidden
        bg-[#020617]
        text-white
      "
    >
      <LandingNavbar />

      <HeroSection />

      <ResourcesSection />

      <HowItWorks />
    </main>
  )
}