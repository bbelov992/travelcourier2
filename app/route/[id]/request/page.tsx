'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

export default function CreateRequestPage() {
  const { id: routeId } = useParams() as { id: string }

  const [form, setForm] = useState({
    sender_name: '',
    contact: '',
    description: '',
    weight: '',
    comment: '',
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const validRouteId = /^[0-9a-fA-F-]{36}$/.test(routeId) ? routeId : null

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Вы должны войти в аккаунт для отправки заявки')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('requests').insert({
      route_id: validRouteId,
      sender_id: user.id,
      weight: form.weight ? Number(form.weight) : null,
      message: form.comment || null,
      status: 'pending',
    })

    setLoading(false)

    if (error) {
      alert('Ошибка при отправке заявки: ' + error.message)
    } else {
      setSuccess(true)
      setForm({
        sender_name: '',
        contact: '',
        description: '',
        weight: '',
        comment: '',
      })
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-xl">
  
          <button
            onClick={() => (window.location.href = "/")}
            className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
  
          <h2 className="text-2xl font-bold text-black mb-4">
            Заявка отправлена!
          </h2>
  
          <p className="text-black mb-6">
            Курьер получит уведомление и свяжется с вами.
          </p>
  
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90 transition"
          >
            Вернуться на главную
          </button>
  
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 relative">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 text-black text-xl"
        >
          ✕
        </button>
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Заявка на доставку
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="sender_name"
            placeholder="Ваше имя"
            value={form.sender_name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />

          <input
            type="text"
            name="contact"
            placeholder="Контакт (телефон, Telegram или email)"
            value={form.contact}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />

          <textarea
            name="description"
            placeholder="Описание посылки"
            value={form.description}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />

          <input
            type="number"
            name="weight"
            placeholder="Вес (кг)"
            value={form.weight}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />

          <textarea
            name="comment"
            placeholder="Комментарий (необязательно)"
            value={form.comment}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </button>
        </form>
      </div>
    </main>
  )
}