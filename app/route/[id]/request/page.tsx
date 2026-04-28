'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type RequestForm = {
  sender_name: string
  contact: string
  description: string
  weight: string
  comment: string
}

type SavedRequest = {
  id: string
  sender_name: string | null
  contact: string | null
  description: string | null
  message: string | null
}

function isSchemaMismatchError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false
  }

  const details = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()

  return (
    details.includes('pgrst204') ||
    details.includes('schema cache') ||
    details.includes('column')
  )
}

function getSchemaMismatchMessage(error: { message?: string } | null) {
  const details = error?.message ? `\n\nТехническая ошибка: ${error.message}` : ""

  return (
    "Не удалось сохранить все поля заявки. Скорее всего, Supabase schema для таблицы requests обновлена не полностью. " +
    "Сначала заново выполните SQL-миграцию, иначе имя, контакт и описание будут теряться." +
    details
  )
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function hasMissingCoreRequestFields(
  savedRequest: SavedRequest | null,
  requestPayload: {
    sender_name: string | null
    contact: string | null
    description: string | null
    message: string | null
  }
) {
  if (!savedRequest) {
    return true
  }

  return (
    savedRequest.sender_name !== requestPayload.sender_name ||
    savedRequest.contact !== requestPayload.contact ||
    savedRequest.description !== requestPayload.description ||
    savedRequest.message !== requestPayload.message
  )
}

export default function CreateRequestPage() {
  const { id: routeId } = useParams() as { id: string }

  const [form, setForm] = useState<RequestForm>({
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

    if (!validRouteId) {
      alert('Маршрут не найден или ссылка повреждена')
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Вы должны войти в аккаунт для отправки заявки')
      setLoading(false)
      return
    }

    const requestPayload = {
      route_id: validRouteId,
      sender_id: user.id,
      sender_name: normalizeOptionalText(form.sender_name),
      contact: normalizeOptionalText(form.contact),
      description: normalizeOptionalText(form.description),
      weight: form.weight ? Number(form.weight) : null,
      message: normalizeOptionalText(form.comment),
      status: 'pending',
    }

    const { data: insertedRequest, error } = await supabase
      .from('requests')
      .insert(requestPayload)
      .select('id, sender_name, contact, description, message')
      .single()

    if (error) {
      console.error('Request insert failed', error)
      setLoading(false)

      if (isSchemaMismatchError(error)) {
        alert(getSchemaMismatchMessage(error))
        return
      }

      alert('Ошибка при отправке заявки: ' + error.message)
      return
    }

    if (hasMissingCoreRequestFields(insertedRequest, requestPayload)) {
      console.error('Request insert lost fields', {
        requestPayload,
        insertedRequest,
      })

      const { data: repairedRequest, error: repairError } = await supabase
        .from('requests')
        .update({
          sender_name: requestPayload.sender_name,
          contact: requestPayload.contact,
          description: requestPayload.description,
          message: requestPayload.message,
        })
        .eq('id', insertedRequest.id)
        .select('id, sender_name, contact, description, message')
        .single()

      if (repairError) {
        console.error('Request repair failed', repairError)
        setLoading(false)
        alert(
          'Заявка создалась, но имя, контакт или описание сохранились не полностью. ' +
            'Проверь Supabase schema и не принимай эту заявку, пока проблема не исправлена.'
        )
        return
      }

      if (hasMissingCoreRequestFields(repairedRequest, requestPayload)) {
        console.error('Request repair still missing fields', {
          requestPayload,
          repairedRequest,
        })
        setLoading(false)
        alert(
          'Заявка создалась, но данные отправителя сохранились не полностью. ' +
            'Проверь Supabase schema и отправь заявку заново после фикса.'
        )
        return
      }
    }

    setLoading(false)
    setSuccess(true)
    setForm({
      sender_name: '',
      contact: '',
      description: '',
      weight: '',
      comment: '',
    })
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
            onClick={() => (window.location.href = "/sender")}
            className="mb-3 w-full bg-black text-white py-3 rounded-xl hover:opacity-90 transition"
          >
            Перейти в кабинет отправителя
          </button>
  
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-gray-100 text-black py-3 rounded-xl hover:opacity-90 transition"
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
