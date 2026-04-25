"use client"

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

export default function OrderCard({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false)

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
    let { error: orderError } = await supabase.from("orders").insert({
      route_id: order.route_id,
      sender_id: order.sender_id,
      sender_name: order.sender_name ?? null,
      contact: order.contact ?? null,
      description: order.description ?? null,
      weight: order.weight ?? null,
      message: order.message ?? null,
      status: "active",
      request_id: order.id,
    })

    if (orderError && isSchemaMismatchError(orderError)) {
      const fallbackInsert = await supabase.from("orders").insert({
        route_id: order.route_id,
        sender_id: order.sender_id,
        sender_name: order.sender_name ?? null,
        description: order.description ?? null,
        message: order.message ?? null,
        status: "active",
        request_id: order.id,
      })

      orderError = fallbackInsert.error
    }

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
    <div className="border rounded-xl p-4 mb-4 bg-white">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Заявка #{String(order.id).slice(0, 8)}
          </p>
          <p className="font-medium text-black">
            Статус: {statusLabels[order.status] ?? order.status}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-sm text-gray-500">Отправитель</p>
          <p className="mt-1 text-black">{order.sender_name || "Не указан"}</p>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-sm text-gray-500">Контакт</p>
          <p className="mt-1 text-black">{order.contact || "Не указан"}</p>
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

      {order.status === "pending" && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Принять
          </button>

          <button
            onClick={handleReject}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Отклонить
          </button>
        </div>
      )}

      {order.status === "accepted" && (
        <div className="mt-4 text-sm font-medium text-emerald-700">
          Заявка уже принята и перенесена в активные заказы.
        </div>
      )}

      {order.status === "rejected" && (
        <div className="mt-3 text-red-600 font-medium">
          Отклонено
        </div>
      )}
    </div>
  )
}
