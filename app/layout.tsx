import type { Metadata } from "next"
import { Geist_Mono, Raleway } from "next/font/google"

import "./globals.css"
import "lenis/dist/lenis.css"
import { SmoothScroll } from "@/components/workspace/smooth-scroll"
import { AppMotion } from "@/components/workspace/motion"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const raleway = Raleway({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Catat Denda",
  description: "Project Catat Denda",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        raleway.variable
      )}
    >
      <body>
        <AppMotion>
          <SmoothScroll />
          <ThemeProvider>{children}</ThemeProvider>
        </AppMotion>
      </body>
    </html>
  )
}
