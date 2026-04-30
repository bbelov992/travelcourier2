"use client"

import OrderStatusTimeline from "@/components/OrderStatusTimeline"
import { supabase } from "@/lib/supabase"
import { useState } from "react"

type Order = {
  id: string
  route_id: string
  sender_id: string
  sender_name?: string | null
  contact?: string | null
  description?: string | null
  weight?: number | null
  message?: string | null
  status: string
}

const statusLabels: Record<string, string> = {
  pending: "Ожидает решения",
  accepted: "Принята",
  rejected: "Отклонена",
}

function isSchemaMismatchError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false
  }

  const details = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase()

  return (
    details.includes("pgrst204") ||
    details.includes("schema cache") ||
    details.includes("column")
  )
}

async function insertOrderWithFallbacks(order: Order) {
  const payloads = [
    {
      route_id: order.route_id,
      sender_id: order.sender_id,
      sender_name: order.sender_name ?? null,
      contact: order.contact ?? null,
      description: order.description ?? null,
      weight: order.weight ?? null,
      message: order.message ?? null,
      status: "active",
      request_id: order.id,
    },
    {
      route_id: order.route_id,
      sender_id: order.sender_id,
      description: order.description ?? null,
      message: order.message ?? null,
      status: "active",
      request_id: order.id,
    },
    {
      route_id: order.route_id,
      sender_id: order.sender_id,
      status: "active",
      request_id: order.id,
    },
    {
      route_id: order.route_id,
      sender_id: order.sender_id,
      status: "active",
    },
  ]

  let lastError: { message?: string } | null = null

  for (const payload of payloads) {
    const { error } = await supabase.from("orders").insert(payload)

    if (!error) {
      return null
    }

    lastError = error

    if (!isSchemaMismatchError(error)) {
      return error
    }
  }

  return lastError
}

export default function OrderCard({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleAccept = async () => {
    setLoading(true)

    // 1. Update request status to accepted
    const { error: requestError } = await supabase
      .from("requests")
      .update({ status: "accepted" })
      .eq("id", order.id)

    if (requestError) {
      alert("Ошибка обновления заявки: " + requestError.message)
      setLoading(false)
      return
    }

    // 2. Create order record
    const orderError = await insertOrderWithFallbacks(order)

    if (orderError) {
      alert("Ошибка создания ордера: " + orderError.message)
      setLoading(false)
      return
    }

    window.location.reload()
  }

  const handleReject = async () => {
    setLoading(true)

    const { error } = await supabase
      .from("requests")
      .update({ status: "rejected" })
      .eq("id", order.id)

    if (error) {
      alert("Ошибка обновления: " + error.message)
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mb-3 w-full rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-100 hover:bg-blue-50"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">
              Заявка #{String(order.id).slice(0, 8)}
            </p>
            <p className="mt-1 truncate font-medium text-black">
              {order.sender_name || "Отправитель не указан"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {order.weight ? `${order.weight} кг` : "Вес не указан"}
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {statusLabels[order.status] ?? order.status}
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Заявка #{String(order.id).slice(0, 8)}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-black">
                  Заявка на доставку
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xl leading-none text-gray-500 transition hover:text-black"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            {order.status === "accepted" && (
              <div className="mb-5">
                <OrderStatusTimeline status="active" />
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-sm text-gray-500">Отправитель</p>
                <p className="mt-1 text-black">
                  {order.sender_name || "Не указан"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-sm text-gray-500">Контакт</p>
                <p className="mt-1 text-black">
                  {order.status === "pending"
                    ? "Скрыт до принятия заявки"
                    : order.contact || "Не указан"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-sm text-gray-500">Вес</p>
                <p className="mt-1 text-black">
                  {order.weight ? `${order.weight} кг` : "Не указан"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-sm text-gray-500">ID отправителя</p>
                <p className="mt-1 break-all text-black">{order.sender_id}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-gray-50 p-3">
              <p className="text-sm text-gray-500">Описание посылки</p>
              <p className="mt-1 text-black">
                {order.description || "Описание не добавлено"}
              </p>
            </div>

            <div className="mt-3 rounded-xl bg-gray-50 p-3">
              <p className="text-sm text-gray-500">Комментарий</p>
              <p className="mt-1 text-black">
                {order.message || "Комментарий не добавлен"}
              </p>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              {order.status === "pending" && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAccept}
                    disabled={loading}
                    className="rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Принять заявку
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Отклонить
                  </button>
                </div>
              )}

              {order.status === "accepted" && (
                <div className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  Заявка принята и перенесена в активные заказы.
                </div>
              )}

              {order.status === "rejected" && (
                <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
                  Заявка отклонена.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
