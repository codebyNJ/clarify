import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Instrument_Serif, Poppins } from "next/font/google";
import "./globals.css"
import { cn } from "@/lib/utils"

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
})

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: {
    template: "%s | Clarify",
    default: "Clarify",
  },
  description:
    "We stand at the forefront of a new era, where creativity meets technology to redefine what's possible. Our mission is to empower individuals and businesses alike with groundbreaking solutions that inspire change and drive progress.",
  icons: {
    icon: [
      { url: "/images/favicon.png", type: "image/png" },
      { url: "/images/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn(GeistSans.variable, GeistMono.variable, instrumentSerif.variable, poppins.variable)}>
        {children}
      </body>
    </html>
  )
}
