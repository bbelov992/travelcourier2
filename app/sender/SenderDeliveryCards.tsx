"use client"

import { type FormEvent, useState } from "react"
import OrderStatusTimeline from "@/components/OrderStatusTimeline"
import { supabase } from "@/lib/supabase"
import {
  ORDER_STATUS_BADGE_STYLES,
  ORDER_STATUS_LABELS,
} from "@/lib/order-status"

type SenderRequest = {
  id: string
  route_id: string | null
  sender_name?: string | null
  contact?: string | null
  description?: string | null
  weight: number | null
  message: string | null
  status: string | null
  created_at?: string | null
}

type SenderOrder = {
  id: string
  route_id: string | null
  request_id?: string | null
  courier_id?: string | null
  sender_id?: string | null
  sender_name?: string | null
  contact?: string | null
  description?: string | null
  weight?: number | null
  message?: string | null
  status: string | null
  created_at?: string | null
}

type RouteSummary = {
  id: string
  from_city: string | null
  to_city: string | null
  courier_id?: string | null
  courier_name: string | null
  departure_date: string | null
}

const requestStatusLabels: Record<string, string> = {
  pending: "Ожидает решения",
  accepted: "Принята курьером",
  rejected: "Отклонена",
}

const requestStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
}

function formatDate(date: string | null | undefined) {
  return date ? new Date(date).toLocaleDateString("ru-RU") : "—"
}

function routeTitle(route: RouteSummary | undefined) {
  return route
    ? `${route.from_city ?? "—"} → ${route.to_city ?? "—"}`
    : "Маршрут больше недоступен"
}

function DetailTile({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-black">{value || "Не указан"}</p>
    </div>
  )
}

export function SenderOrderCard({
  order,
  route,
  updating,
  onConfirm,
  reviewSubmitted,
  onReviewSubmitted,
  finished = false,
}: {
  order: SenderOrder
  route: RouteSummary | undefined
  updating: boolean
  onConfirm: (orderId: string) => void
  reviewSubmitted?: boolean
  onReviewSubmitted?: (orderId: string) => void
  finished?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState("5")
  const [reviewComment, setReviewComment] = useState("")
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [localReviewSubmitted, setLocalReviewSubmitted] = useState(false)
  const statusLabel = ORDER_STATUS_LABELS[order.status ?? ""] ?? "В работе"
  const statusStyle =
    ORDER_STATUS_BADGE_STYLES[order.status ?? ""] ?? "bg-gray-100 text-gray-700"
  const hasReview = Boolean(reviewSubmitted || localReviewSubmitted)
  const courierId = order.courier_id ?? route?.courier_id ?? null

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!courierId || !order.sender_id) {
      setReviewError("Не хватает данных курьера или отправителя для отзыва.")
      return
    }

    setReviewLoading(true)
    setReviewError(null)

    const { error } = await supabase.from("reviews").insert({
      order_id: order.id,
      courier_id: courierId,
      sender_id: order.sender_id,
      rating: Number(rating),
      comment: reviewComment.trim() || null,
    })

    if (error) {
      setReviewError("Не удалось сохранить отзыв: " + error.message)
      setReviewLoading(false)
      return
    }

    setLocalReviewSubmitted(true)
    onReviewSubmitted?.(order.id)
    setReviewLoading(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full rounded-xl border p-4 text-left shadow-sm transition ${
          finished
            ? "border-gray-100 bg-white hover:bg-gray-50"
            : "border-emerald-100 bg-white hover:border-emerald-200 hover:bg-emerald-50"
        }`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="truncate font-medium text-black">{routeTitle(route)}</p>
            <p className="mt-1 text-sm text-gray-500">
              Курьер: {route?.courier_name ?? "—"} · {formatDate(route?.departure_date)}
            </p>
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
                <p className="text-sm text-gray-500">
                  Заказ #{String(order.id).slice(0, 8)}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-black">
                  {routeTitle(route)}
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

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailTile label="Курьер" value={route?.courier_name} />
              <DetailTile label="Дата вылета" value={formatDate(route?.departure_date)} />
              <DetailTile label="Контакт" value={order.contact} />
              <DetailTile
                label="Вес"
                value={order.weight ? `${order.weight} кг` : null}
              />
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
              {order.status === "completion_requested" && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onConfirm(order.id)}
                    disabled={updating}
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Подтвердить доставку
                  </button>

                  <p className="text-sm text-amber-800">
                    Курьер отметил передачу получателю. После подтверждения
                    последняя точка станет зеленой.
                  </p>
                </div>
              )}

              {order.status === "completed" && (
                <div className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  Доставка подтверждена и завершена.
                </div>
              )}

              {order.status === "completed" && !hasReview && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <p className="font-medium text-black">Оцените курьера</p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
                    <select
                      value={rating}
                      onChange={(event) => setRating(event.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-black"
                    >
                      <option value="5">5</option>
                      <option value="4">4</option>
                      <option value="3">3</option>
                      <option value="2">2</option>
                      <option value="1">1</option>
                    </select>

                    <input
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-black"
                      placeholder="Комментарий к доставке"
                    />
                  </div>

                  {reviewError && (
                    <p className="mt-3 text-sm text-rose-700">{reviewError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="mt-3 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {reviewLoading ? "Сохраняем..." : "Оставить отзыв"}
                  </button>
                </form>
              )}

              {order.status === "completed" && hasReview && (
                <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-medium text-blue-800">
                  Отзыв уже сохранен. Спасибо за оценку.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function SenderRequestCard({
  request,
  route,
  profileName,
}: {
  request: SenderRequest
  route: RouteSummary | undefined
  profileName: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const statusLabel = request.status
    ? requestStatusLabels[request.status] ?? request.status
    : "Неизвестно"
  const statusStyle = request.status
    ? requestStatusStyles[request.status] ?? "bg-gray-100 text-gray-700"
    : "bg-gray-100 text-gray-700"

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-100 hover:bg-blue-50"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="truncate font-medium text-black">{routeTitle(route)}</p>
            <p className="mt-1 text-sm text-gray-500">
              Заявка #{String(request.id).slice(0, 8)} · {formatDate(request.created_at)}
            </p>
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
                <p className="text-sm text-gray-500">
                  Заявка #{String(request.id).slice(0, 8)}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-black">
                  {routeTitle(route)}
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

            {request.status === "accepted" && (
              <div className="mb-5">
                <OrderStatusTimeline status="active" />
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailTile label="Курьер" value={route?.courier_name} />
              <DetailTile label="Дата вылета" value={formatDate(route?.departure_date)} />
              <DetailTile
                label="Вес"
                value={request.weight ? `${request.weight} кг` : null}
              />
              <DetailTile label="Отправлена" value={formatDate(request.created_at)} />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <DetailTile label="Контакт" value={request.contact} />
              <DetailTile
                label="Имя в заявке"
                value={request.sender_name || profileName}
              />
            </div>

            <div className="mt-3 rounded-xl bg-gray-50 p-3">
              <p className="text-sm text-gray-500">Описание посылки</p>
              <p className="mt-1 text-black">
                {request.description || "Описание не добавлено"}
              </p>
            </div>

            <div className="mt-3 rounded-xl bg-gray-50 p-3">
              <p className="text-sm text-gray-500">Комментарий</p>
              <p className="mt-1 text-black">
                {request.message || "Комментарий не добавлен"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
