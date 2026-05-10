"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
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
  review?: OrderReview | null
}

type OrderReview = {
  id: string
  order_id: string
  rating: number
  comment: string | null
  created_at: string | null
}

function formatDate(date: string | null | undefined) {
  return date ? new Date(date).toLocaleDateString("ru-RU") : "Дата не указана"
}

export default function ActiveOrderCard({ order }: { order: ActiveOrder }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
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
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mb-3 w-full rounded-xl border border-emerald-100 bg-white p-4 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-emerald-700">
              Заказ #{String(order.id).slice(0, 8)}
            </p>
            <p className="mt-1 truncate font-medium text-black">
              {order.sender_name || "Отправитель не указан"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {order.weight ? `${order.weight} кг` : "Вес не указан"}
            </p>
            {order.review && (
              <p className="mt-1 text-sm font-medium text-amber-700">
                Отзыв: {order.review.rating}/5
              </p>
            )}
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${statusStyle}`}
          >
            {statusLabel}
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
                <p className="text-sm text-emerald-700">
                  Заказ #{String(order.id).slice(0, 8)}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-black">
                  Доставка отправителя
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

            <div className="mb-5">
              <OrderStatusTimeline status={order.status} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-sm text-gray-500">Отправитель</p>
                <p className="mt-1 text-black">
                  {order.sender_name || "Не указан"}
                </p>
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

            <div className="mt-5 border-t border-gray-100 pt-4">
              {order.status === "active" && (
                <button
                  type="button"
                  onClick={() => void handleStatusUpdate("in_transit")}
                  disabled={isPending}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Подтвердить получение посылки
                </button>
              )}

              {order.status === "in_transit" && (
                <button
                  type="button"
                  onClick={() => void handleStatusUpdate("completion_requested")}
                  disabled={isPending}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Передал получателю
                </button>
              )}

              {order.status === "completion_requested" && (
                <div className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
                  Передача отмечена курьером. Ожидаем финальное подтверждение
                  отправителя.
                </div>
              )}

              {order.status === "completed" && (
                <div className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  Заказ подтвержден отправителем и завершен.
                </div>
              )}

              {order.status === "completed" && order.review && (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-black">Отзыв отправителя</p>
                    <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-medium text-amber-800">
                      {order.review.rating}/5
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-amber-900">
                    {formatDate(order.review.created_at)}
                  </p>

                  <p className="mt-3 text-black">
                    {order.review.comment || "Отзыв без комментария"}
                  </p>
                </div>
              )}

              {order.status === "completed" && !order.review && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  Отправитель пока не оставил отзыв к этому заказу.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
