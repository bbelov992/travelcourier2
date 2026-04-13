"use client"

import type { Metadata } from "next"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "Travel Courier",
  description: "Доставка через путешественников",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async () => {
        const { data } = await supabase.auth.getUser()
        setUser(data.user)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        
        {/* HEADER */}
        <header className="w-full flex justify-end items-center px-6 py-4">
          {!user ? (
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 border border-black rounded-xl"
              >
                Войти
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-black text-white rounded-xl"
              >
                Регистрация
              </Link>
            </div>
          ) : (
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-black text-white rounded-xl"
            >
              Мой профиль
            </Link>
          )}
        </header>

        {children}
      </body>
    </html>
  )
}
