import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NexusLend - DeFi Lending Protocol",
  description: "The next generation of decentralized lending. Secure, fast, and transparent.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`min-h-screen bg-background text-foreground antialiased transition-colors duration-300 ${inter.className}`}>


        {children}
        <Toaster />
      </body>
    </html>
  )
}
