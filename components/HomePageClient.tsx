"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type RouteCard = {
  id: string
  from_city: string
  to_city: string
  courier_name: string | null
  max_weight: number | null
  departure_date: string | null
}

type HomePageClientProps = {
  initialRoutes: RouteCard[]
  loadError: string | null
}

export default function HomePageClient({
  initialRoutes,
  loadError,
}: HomePageClientProps) {
  const [fromFilter, setFromFilter] = useState("")
  const [toFilter, setToFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  const filteredRoutes = useMemo(() => {
    return initialRoutes.filter((route) => {
      const matchFrom =
        !fromFilter ||
        route.from_city.toLowerCase().includes(fromFilter.toLowerCase())

      const matchTo =
        !toFilter ||
        route.to_city.toLowerCase().includes(toFilter.toLowerCase())

      const matchDate = !dateFilter || route.departure_date === dateFilter

      return matchFrom && matchTo && matchDate
    })
  }, [dateFilter, fromFilter, initialRoutes, toFilter])

  const hasFilters = Boolean(fromFilter || toFilter || dateFilter)

  const resetFilters = () => {
    setFromFilter("")
    setToFilter("")
    setDateFilter("")
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-3 text-center text-4xl font-bold text-black">
          Доставка через путешественников
        </h1>

        <p className="mb-10 text-center text-black">
          Быстро, безопасно и дешевле курьерских служб
        </p>

        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="grid flex-1 gap-4 rounded-2xl bg-white p-6 shadow-md md:grid-cols-4">
            <input
              placeholder="Откуда"
              value={fromFilter}
              onChange={(event) => setFromFilter(event.target.value)}
              className="rounded-xl border px-4 py-3 text-black placeholder-black"
            />

            <input
              placeholder="Куда"
              value={toFilter}
              onChange={(event) => setToFilter(event.target.value)}
              className="rounded-xl border px-4 py-3 text-black placeholder-black"
            />

            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded-xl border px-4 py-3 text-black"
            />

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="rounded-xl bg-black py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Сбросить
            </button>
          </div>

          <Link
            href="/create-route"
            className="whitespace-nowrap rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90"
          >
            Создать маршрут
          </Link>
        </div>

        <div className="space-y-4">
          {loadError && (
            <div className="rounded-2xl bg-white p-6 text-center text-black shadow-sm">
              <p className="mb-4">Не удалось загрузить маршруты. Попробуйте еще раз.</p>

              <Link
                href="/"
                className="inline-flex rounded-xl bg-black px-5 py-2 text-sm text-white transition hover:opacity-90"
              >
                Обновить страницу
              </Link>
            </div>
          )}

          {!loadError && filteredRoutes.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-center text-black shadow-sm">
              Маршруты не найдены
            </div>
          )}

          {!loadError &&
            filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-black">
                  {route.from_city} → {route.to_city}
                </h3>

                <p className="text-sm text-black">Курьер: {route.courier_name}</p>

                <p className="text-sm text-black">
                  Максимальный вес: {route.max_weight} кг
                </p>

                <p className="text-sm text-black">
                  Дата вылета:{" "}
                  {route.departure_date
                    ? new Date(route.departure_date).toLocaleDateString("ru-RU")
                    : "—"}
                </p>

                <div className="mt-4">
                  <Link
                    href={`/route/${route.id}/request`}
                    className="inline-block rounded-xl bg-black px-5 py-2 text-sm text-white transition hover:opacity-90"
                  >
                    Выбрать
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </main>
  )
}
