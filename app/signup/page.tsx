"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<'courier' | 'sender'>('sender')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Регистрация пользователя
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id

    // 2. Создание профиля с ролью
    if (userId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role,
        })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }
    }

    // 3. Автоматический вход после регистрации
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // 4. Переход в личный кабинет
    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Регистрация</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="password"
            placeholder="Пароль"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium">Выберите роль:</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole('sender')}
                className={`px-4 py-2 rounded-xl border ${role === 'sender' ? 'bg-black text-white' : ''}`}
              >
                Я отправитель
              </button>
              <button
                type="button"
                onClick={() => setRole('courier')}
                className={`px-4 py-2 rounded-xl border ${role === 'courier' ? 'bg-black text-white' : ''}`}
              >
                Я курьер
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl"
          >
            {loading ? "Создание..." : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </main>
  )
}