import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { DirectLoginWrapper } from "@/components/auth/direct-login-wrapper"
import { ToastProvider } from "@/components/ui/toast"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Clubwiz Admin - Club & Event Management Platform",
  description: "Clubwiz Admin Platform - Manage clubs, events, and bookings. Admin and SuperAdmin access only.",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Zen+Tokyo+Zoo&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo/logo.png" />
        <meta name="theme-color" content="#021313" />
      </head>
      <body className="antialiased bg-background-primary text-text-primary dark">
        <ToastProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
            <AuthProvider>
              <DirectLoginWrapper>
                <main className="min-h-screen max-w-md mx-auto relative overflow-hidden">
                  {children}
                </main>
              </DirectLoginWrapper>
            </AuthProvider>
          </ThemeProvider>
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  )
}
