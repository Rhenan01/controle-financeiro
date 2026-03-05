import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

import Sidebar from "../components/Sidebar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Controle Financeiro",
  description: "Dashboard financeiro pessoal",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <html lang="pt-br">

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        <Sidebar />

        <main className="ml-52 min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">

          {children}

        </main>

      </body>

    </html>

  )
}