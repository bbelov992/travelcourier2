"use client"

import { supabase } from "@/lib/supabase"

export default function OrderCard({ order }: any) {
  const handleUpdate = async (newStatus: string) => {
    await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id)

    window.location.reload()
  }

  return (
    <div className="border rounded-xl p-4 mb-4">

      <p className="text-black mb-2">
        Статус: {order.status}
      </p>

      {order.status === "pending" && (
        <div className="flex gap-3">
          <button
            onClick={() => handleUpdate("accepted")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Принять
          </button>

          <button
            onClick={() => handleUpdate("rejected")}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Отклонить
          </button>
        </div>
      )}

      {order.status === "accepted" && (
        <div className="mt-3 text-black">
          <p>Описание: {order.description}</p>
          <p>Сообщение: {order.massage}</p>
        </div>
      )}
    </div>
  )
}