"use client"

import { supabase } from "@/lib/supabase"
import { useState } from "react"

type Order = {
  id: string
  route_id: string
  sender_id: string
  sender_name?: string | null
  description?: string | null
  message?: string | null
  status: string
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
    const { error: orderError } = await supabase.from("orders").insert({
      route_id: order.route_id,
      sender_id: order.sender_id,
      sender_name: order.sender_name ?? null,
      description: order.description ?? null,
      message: order.message ?? null,
      status: "active",
      request_id: order.id,
    })

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

      <p className="text-black mb-2">
        Статус: {order.status}
      </p>

      {order.status === "pending" && (
        <div className="flex gap-3">
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
        <div className="mt-3 text-black">
          <p>Описание: {order.description}</p>
          <p>Сообщение: {order.message}</p>
          <p>ID отправителя: {order.sender_id}</p>
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
