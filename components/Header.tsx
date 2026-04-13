'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return null

  return (
    <header className="bg-black text-white px-6 py-4 flex justify-between items-center">
      
      <Link
        href="/"
        className="bg-gray-800 px-4 py-2 rounded-xl hover:opacity-90 transition"
      >
        На главную
      </Link>

      <div className="flex gap-3">
        {session ? (
          <>
            <Link
              href="/profile"
              className="bg-gray-800 px-4 py-2 rounded-xl hover:opacity-90 transition"
            >
              Мой профиль
            </Link>

            <button
              onClick={handleLogout}
              className="bg-gray-700 px-4 py-2 rounded-xl hover:opacity-90 transition"
            >
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="bg-gray-800 px-4 py-2 rounded-xl hover:opacity-90 transition"
            >
              Войти
            </Link>

            <Link
              href="/register"
              className="bg-gray-700 px-4 py-2 rounded-xl hover:opacity-90 transition"
            >
              Регистрация
            </Link>
          </>
        )}
      </div>
    </header>
  )
}