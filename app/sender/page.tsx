"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import OrderStatusTimeline from "@/components/OrderStatusTimeline"
import { supabase } from "@/lib/supabase"
import {
  isActiveOrderStatus,
  isFinishedOrderStatus,
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
  courier_name: string | null
  departure_date: string | null
}

const statusLabels: Record<string, string> = {
  pending: "Ожидает решения",
  accepted: "Принята курьером",
  rejected: "Отклонена",
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
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

export default function SenderPage() {
  const router = useRouter()
  const [profileName, setProfileName] = useState<string | null>(null)
  const [requests, setRequests] = useState<SenderRequest[]>([])
  const [orders, setOrders] = useState<SenderOrder[]>([])
  const [routesById, setRoutesById] = useState<Record<string, RouteSummary>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let intervalId: number | undefined

    const fetchRequests = async (senderId: string, showLoader = false) => {
      if (showLoader && !cancelled) {
        setLoading(true)
      }

      const requestsWithFullPayload = await supabase
        .from("requests")
        .select(
          "id, route_id, sender_name, contact, description, weight, message, status, created_at"
        )
        .eq("sender_id", senderId)
        .order("created_at", { ascending: false })

      const requestsResult = requestsWithFullPayload.error &&
        isSchemaMismatchError(requestsWithFullPayload.error)
        ? await supabase
            .from("requests")
            .select("id, route_id, weight, message, status")
            .eq("sender_id", senderId)
            .order("id", { ascending: false })
        : requestsWithFullPayload

      if (cancelled) {
        return
      }

      if (requestsResult.error) {
        setError("Не удалось загрузить заявки: " + requestsResult.error.message)
        setLoading(false)
        return
      }

      const nextRequests = (requestsResult.data ?? []) as SenderRequest[]
      setRequests(nextRequests)

      const ordersResult = await supabase
        .from("orders")
        .select("*")
        .eq("sender_id", senderId)
        .order("id", { ascending: false })

      if (cancelled) {
        return
      }

      if (ordersResult.error) {
        setError("Не удалось загрузить активные заказы: " + ordersResult.error.message)
        setLoading(false)
        return
      }

      const rawOrders = (ordersResult.data ?? []) as SenderOrder[]
      const orderRequestIds = rawOrders
        .map((order) => order.request_id)
        .filter((requestId): requestId is string => Boolean(requestId))
      const { data: linkedRequests } = orderRequestIds.length
        ? await supabase
            .from("requests")
            .select(
              "id, route_id, sender_name, contact, description, weight, message, created_at"
            )
            .in("id", orderRequestIds)
        : { data: [] }

      if (cancelled) {
        return
      }

      const linkedRequestsById = Object.fromEntries(
        ((linkedRequests ?? []) as SenderRequest[]).map((request) => [
          request.id,
          request,
        ])
      )
      const nextOrders = rawOrders.map((order) => {
        const linkedRequest =
          order.request_id ? linkedRequestsById[order.request_id] : undefined

        return {
          ...order,
          route_id: order.route_id ?? linkedRequest?.route_id ?? null,
          sender_name: order.sender_name ?? linkedRequest?.sender_name ?? null,
          contact: order.contact ?? linkedRequest?.contact ?? null,
          description: order.description ?? linkedRequest?.description ?? null,
          weight: order.weight ?? linkedRequest?.weight ?? null,
          message: order.message ?? linkedRequest?.message ?? null,
          created_at: order.created_at ?? linkedRequest?.created_at ?? null,
        }
      })
      setOrders(nextOrders)
      setError(null)

      const routeIds = [
        ...new Set(
          [...nextRequests, ...nextOrders]
            .map((item) => item.route_id)
            .filter((routeId): routeId is string => Boolean(routeId))
        ),
      ]

      if (routeIds.length === 0) {
        setRoutesById({})
        setLoading(false)
        return
      }

      const { data: routeRows } = await supabase
        .from("routes")
        .select("id, from_city, to_city, courier_name, departure_date")
        .in("id", routeIds)

      if (cancelled) {
        return
      }

      const nextRoutesById = Object.fromEntries(
        ((routeRows ?? []) as RouteSummary[]).map((route) => [route.id, route])
      )

      setRoutesById(nextRoutesById)
      setLoading(false)
    }

    const init = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (cancelled) {
        return
      }

      if (authError) {
        setError("Не удалось проверить пользователя: " + authError.message)
        setLoading(false)
        return
      }

      if (!user) {
        router.replace("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single()

      if (cancelled) {
        return
      }

      if (profileError) {
        setError("Не удалось загрузить профиль: " + profileError.message)
        setLoading(false)
        return
      }

      if (!profile) {
        router.replace("/")
        return
      }

      if (profile.role === "courier") {
        router.replace("/courier")
        return
      }

      if (profile.role !== "sender") {
        router.replace("/")
        return
      }

      setProfileName(profile.full_name ?? null)
      await fetchRequests(user.id, true)

      if (cancelled) {
        return
      }

      intervalId = window.setInterval(() => {
        void fetchRequests(user.id)
      }, 10000)
    }

    void init()

    return () => {
      cancelled = true

      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [router])

  const handleOrderStatusUpdate = async (orderId: string, nextStatus: string) => {
    setUpdatingOrderId(orderId)

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)

    if (updateError) {
      setError("Не удалось обновить заказ: " + updateError.message)
      setUpdatingOrderId(null)
      return
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order
      )
    )
    setUpdatingOrderId(null)
  }

  const activeOrders = orders.filter((order) => isActiveOrderStatus(order.status))
  const finishedOrders = orders.filter((order) =>
    isFinishedOrderStatus(order.status)
  )
  const requestIdsWithOrders = new Set(
    orders
      .map((order) => order.request_id)
      .filter((requestId): requestId is string => Boolean(requestId))
  )
  const visibleRequests = requests.filter(
    (request) => !requestIdsWithOrders.has(request.id)
  )

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black shadow-sm transition hover:opacity-90"
            >
              ← Вернуться на главную
            </Link>

            <div>
              <h1 className="text-3xl font-bold text-black">
                Кабинет отправителя
              </h1>

              <p className="text-gray-600">
                {profileName ? `${profileName}, ` : ""}
                здесь собраны все отправленные заявки. Статусы обновляются
                автоматически.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl bg-white p-6 text-center text-black shadow-sm">
            Загружаем ваши заявки...
          </div>
        )}

        {!loading && visibleRequests.length === 0 && activeOrders.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-black">
              У вас пока нет заявок
            </h2>

            <p className="mb-6 text-gray-600">
              Выберите подходящий маршрут на главной странице и отправьте первую
              заявку.
            </p>

            <Link
              href="/"
              className="inline-flex rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90"
            >
              Перейти к маршрутам
            </Link>
          </div>
        )}

        {!loading && activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-black">
              Активные доставки
            </h2>

            <div className="space-y-4">
              {activeOrders.map((order) => {
                const route = order.route_id ? routesById[order.route_id] : undefined

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm"
                  >
                    <div className="mb-4">
                      <OrderStatusTimeline status={order.status} />
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-black">
                          {route
                            ? `${route.from_city ?? "—"} → ${route.to_city ?? "—"}`
                            : "Маршрут больше недоступен"}
                        </h3>

                        <p className="mt-1 text-sm text-emerald-700">
                          {ORDER_STATUS_LABELS[order.status ?? ""] ?? "Заказ в работе"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${
                          ORDER_STATUS_BADGE_STYLES[order.status ?? ""] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status ?? ""] ?? "В работе"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-white p-4">
                        <p className="text-sm text-gray-500">Курьер</p>
                        <p className="mt-1 font-medium text-black">
                          {route?.courier_name ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-sm text-gray-500">Дата вылета</p>
                        <p className="mt-1 font-medium text-black">
                          {route?.departure_date
                            ? new Date(route.departure_date).toLocaleDateString(
                                "ru-RU"
                              )
                            : "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-sm text-gray-500">Контакт</p>
                        <p className="mt-1 text-black">
                          {order.contact || "Не указан"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-sm text-gray-500">Вес</p>
                        <p className="mt-1 font-medium text-black">
                          {order.weight ? `${order.weight} кг` : "Не указан"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-white p-4">
                      <p className="text-sm text-gray-500">Описание посылки</p>
                      <p className="mt-1 text-black">
                        {order.description || "Описание не добавлено"}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl bg-white p-4">
                      <p className="text-sm text-gray-500">Комментарий</p>
                      <p className="mt-1 text-black">
                        {order.message || "Комментарий не добавлен"}
                      </p>
                    </div>

                    {order.status === "completion_requested" && (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            void handleOrderStatusUpdate(order.id, "completed")
                          }
                          disabled={updatingOrderId === order.id}
                          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          Подтвердить получение
                        </button>

                        <p className="text-sm text-amber-800">
                          Курьер отметил доставку. Подтвердите, если посылка уже у вас.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && finishedOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-black">
              Завершенные доставки
            </h2>

            <div className="space-y-4">
              {finishedOrders.map((order) => {
                const route = order.route_id ? routesById[order.route_id] : undefined

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4">
                      <OrderStatusTimeline status={order.status} />
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-black">
                          {route
                            ? `${route.from_city ?? "—"} → ${route.to_city ?? "—"}`
                            : "Маршрут больше недоступен"}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {ORDER_STATUS_LABELS[order.status ?? ""] ?? "Завершено"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${
                          ORDER_STATUS_BADGE_STYLES[order.status ?? ""] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status ?? ""] ?? "Завершено"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Курьер</p>
                        <p className="mt-1 font-medium text-black">
                          {route?.courier_name ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Дата вылета</p>
                        <p className="mt-1 font-medium text-black">
                          {route?.departure_date
                            ? new Date(route.departure_date).toLocaleDateString(
                                "ru-RU"
                              )
                            : "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Контакт</p>
                        <p className="mt-1 text-black">
                          {order.contact || "Не указан"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Вес</p>
                        <p className="mt-1 font-medium text-black">
                          {order.weight ? `${order.weight} кг` : "Не указан"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && visibleRequests.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-black">
              Заявки
            </h2>

            <div className="space-y-4">
              {visibleRequests.map((request) => {
                const route = request.route_id
                  ? routesById[request.route_id]
                  : undefined
                const statusLabel = request.status
                  ? statusLabels[request.status] ?? request.status
                  : "Неизвестно"
                const statusStyle = request.status
                  ? statusStyles[request.status] ?? "bg-gray-100 text-gray-700"
                  : "bg-gray-100 text-gray-700"

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-black">
                          {route
                            ? `${route.from_city ?? "—"} → ${route.to_city ?? "—"}`
                            : "Маршрут больше недоступен"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          Заявка #{String(request.id).slice(0, 8)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${statusStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Курьер</p>
                        <p className="mt-1 font-medium text-black">
                          {route?.courier_name ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Дата вылета</p>
                        <p className="mt-1 font-medium text-black">
                          {route?.departure_date
                            ? new Date(route.departure_date).toLocaleDateString(
                                "ru-RU"
                              )
                            : "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Вес</p>
                        <p className="mt-1 font-medium text-black">
                          {request.weight ? `${request.weight} кг` : "Не указан"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Отправлена</p>
                        <p className="mt-1 font-medium text-black">
                          {request.created_at
                            ? new Date(request.created_at).toLocaleDateString(
                                "ru-RU"
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Контакт</p>
                        <p className="mt-1 text-black">
                          {request.contact || "Не указан"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Имя в заявке</p>
                        <p className="mt-1 text-black">
                          {request.sender_name || profileName || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Описание посылки</p>
                      <p className="mt-1 text-black">
                        {request.description || "Описание не добавлено"}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Комментарий</p>
                      <p className="mt-1 text-black">
                        {request.message || "Комментарий не добавлен"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
