"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type SenderRequest = {
  id: string
  route_id: string | null
  weight: number | null
  message: string | null
  status: string | null
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

export default function SenderPage() {
  const router = useRouter()
  const [profileName, setProfileName] = useState<string | null>(null)
  const [requests, setRequests] = useState<SenderRequest[]>([])
  const [routesById, setRoutesById] = useState<Record<string, RouteSummary>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let intervalId: number | undefined

    const fetchRequests = async (senderId: string, showLoader = false) => {
      if (showLoader && !cancelled) {
        setLoading(true)
      }

      const requestsWithCreatedAt = await supabase
        .from("requests")
        .select("id, route_id, weight, message, status, created_at")
        .eq("sender_id", senderId)
        .order("created_at", { ascending: false })

      const requestsResult = requestsWithCreatedAt.error
        ? await supabase
            .from("requests")
            .select("id, route_id, weight, message, status")
            .eq("sender_id", senderId)
            .order("id", { ascending: false })
        : requestsWithCreatedAt

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
      setError(null)

      const routeIds = [...new Set(
        nextRequests
          .map((request) => request.route_id)
          .filter((routeId): routeId is string => Boolean(routeId))
      )]

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

        {!loading && requests.length === 0 && (
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

        {!loading && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request) => {
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

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
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
        )}
      </div>
    </main>
  )
}
