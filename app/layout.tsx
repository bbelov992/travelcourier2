"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import "./globals.css"

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
        
        <header className="w-full flex justify-between items-center px-6 py-4">
          {/* LEFT: Home button */}
          <Link
            href="/"
            className="px-4 py-2 border border-black rounded-xl"
          >
            На главную
          </Link>

          {/* RIGHT: Auth buttons */}
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
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-black text-white rounded-xl"
              >
                Мой профиль
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = "/"
                }}
                className="px-4 py-2 border border-black rounded-xl"
              >
                Выйти
              </button>
            </div>
          )}
        </header>

        {children}
      </body>
    </html>
  )
}
