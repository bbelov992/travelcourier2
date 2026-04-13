"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push("/login")
        return
      }

      setUserEmail(data.user.email ?? null)
    }

    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Личный кабинет</h1>

        <p className="mb-6 text-black">
          Вы вошли как: <strong>{userEmail}</strong>
        </p>

        <button
          onClick={handleLogout}
          className="w-full bg-black text-white py-3 rounded-xl"
        >
          Выйти
        </button>
      </div>
    </main>
  )
}