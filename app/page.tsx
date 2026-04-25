"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type RouteCard = {
  id: string
  from_city: string
  to_city: string
  courier_name: string | null
  max_weight: number | null
  departure_date: string | null
}

export default function Home() {
  const [routes, setRoutes] = useState<RouteCard[]>([])
  const [loading, setLoading] = useState(true)

  const [fromFilter, setFromFilter] = useState("")
  const [toFilter, setToFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  useEffect(() => {
    const fetchRoutes = async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .order("id", { ascending: false })

      if (!error && data) {
        setRoutes(data as RouteCard[])
      }

      setLoading(false)
    }

    fetchRoutes()
  }, [])

  const filteredRoutes = routes.filter((route) => {
    const matchFrom =
      !fromFilter ||
      route.from_city.toLowerCase().includes(fromFilter.toLowerCase())

    const matchTo =
      !toFilter ||
      route.to_city.toLowerCase().includes(toFilter.toLowerCase())

    const matchDate =
      !dateFilter || route.departure_date === dateFilter

    return matchFrom && matchTo && matchDate
  })

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold text-center text-black mb-3">
          Доставка через путешественников
        </h1>

        <p className="text-center text-black mb-10">
          Быстро, безопасно и дешевле курьерских служб
        </p>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-10">

          <div className="bg-white shadow-md rounded-2xl p-6 grid md:grid-cols-4 gap-4 flex-1">
            <input
              placeholder="Откуда"
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
              className="border rounded-xl px-4 py-3 text-black placeholder-black"
            />

            <input
              placeholder="Куда"
              value={toFilter}
              onChange={(e) => setToFilter(e.target.value)}
              className="border rounded-xl px-4 py-3 text-black placeholder-black"
            />

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border rounded-xl px-4 py-3 text-black"
            />

            <button
              onClick={() => {}}
              className="bg-black text-white rounded-xl py-3 hover:opacity-90 transition"
            >
              Найти
            </button>
          </div>

          <a
            href="/create-route"
            className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 transition whitespace-nowrap"
          >
            Создать маршрут
          </a>

        </div>

        <div className="space-y-4">

          {loading && (
            <div className="bg-white shadow-sm rounded-2xl p-6 text-center text-black">
              Загрузка маршрутов...
            </div>
          )}

          {!loading && filteredRoutes.length === 0 && (
            <div className="bg-white shadow-sm rounded-2xl p-6 text-center text-black">
              Маршруты не найдены
            </div>
          )}

          {filteredRoutes.map((route) => (
            <div
              key={route.id}
              className="bg-white shadow-sm rounded-2xl p-5 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-lg text-black">
                {route.from_city} → {route.to_city}
              </h3>

              <p className="text-black text-sm">
                Курьер: {route.courier_name}
              </p>

              <p className="text-black text-sm">
                Максимальный вес: {route.max_weight} кг
              </p>

              <p className="text-black text-sm">
                Дата вылета: {route.departure_date ? new Date(route.departure_date).toLocaleDateString() : "—"}
              </p>

              <div className="mt-4">
                <a
                  href={`/route/${route.id}/request`}
                  className="inline-block bg-black text-white px-5 py-2 rounded-xl text-sm hover:opacity-90 transition"
                >
                  Выбрать
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
