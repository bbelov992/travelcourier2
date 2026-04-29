"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import OrderStatusTimeline from "@/components/OrderStatusTimeline"
import { supabase } from "@/lib/supabase"
import {
  ORDER_STATUS_BADGE_STYLES,
  ORDER_STATUS_LABELS,
} from "@/lib/order-status"

type ActiveOrder = {
  id: string
  sender_id: string
  sender_name?: string | null
  contact?: string | null
  description?: string | null
  weight?: number | null
  message?: string | null
  status: string
}

export default function ActiveOrderCard({ order }: { order: ActiveOrder }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleStatusUpdate = async (nextStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", order.id)

    if (error) {
      alert("Не удалось обновить статус заказа: " + error.message)
      return
    }

    startTransition(() => {
      router.refresh()
    })
  }

  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status
  const statusStyle =
    ORDER_STATUS_BADGE_STYLES[order.status] ?? "bg-gray-100 text-gray-700"

  return (
    <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-emerald-700">
            Заказ #{String(order.id).slice(0, 8)}
          </p>
          <p className="mt-1 font-medium text-black">Статус: {statusLabel}</p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mb-4">
        <OrderStatusTimeline status={order.status} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <p className="text-sm text-gray-500">Отправитель</p>
          <p className="mt-1 text-black">{order.sender_name || "Не указан"}</p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-sm text-gray-500">Контакт</p>
          <p className="mt-1 text-black">{order.contact || "Не указан"}</p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-sm text-gray-500">Вес</p>
          <p className="mt-1 text-black">
            {order.weight ? `${order.weight} кг` : "Не указан"}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-sm text-gray-500">ID отправителя</p>
          <p className="mt-1 break-all text-black">{order.sender_id}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white p-3">
        <p className="text-sm text-gray-500">Описание посылки</p>
        <p className="mt-1 text-black">
          {order.description || "Описание не добавлено"}
        </p>
      </div>

      <div className="mt-3 rounded-xl bg-white p-3">
        <p className="text-sm text-gray-500">Комментарий</p>
        <p className="mt-1 text-black">
          {order.message || "Комментарий не добавлен"}
        </p>
      </div>

      {order.status === "active" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleStatusUpdate("in_transit")}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Посылка у меня
          </button>
        </div>
      )}

      {order.status === "in_transit" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleStatusUpdate("completion_requested")}
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Отметить как доставленную
          </button>
        </div>
      )}

      {order.status === "completion_requested" && (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Ожидаем подтверждение от отправителя.
        </div>
      )}

      {order.status === "completed" && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          Заказ подтвержден как доставленный.
        </div>
      )}
    </div>
  )
}
