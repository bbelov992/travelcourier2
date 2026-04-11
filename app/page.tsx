import { connection } from 'next/server'

import { getSupabaseClient } from '../lib/supabase'

type Route = {
  id: string | number
  from_city: string
  to_city: string
  courier_name: string
  max_weight: number | string
}

export default async function Page() {
  await connection()

  const supabase = getSupabaseClient()
  let routes: Route[] = []

  if (supabase) {
    const { data, error } = await supabase.from('routes').select('*')

    if (!error && data) {
      routes = data as Route[]
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Доставка через путешественников
          </h1>
          <p className="text-gray-600 text-lg">
            Быстро, безопасно и дешевле курьерских служб
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="-mt-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex gap-4">
            <input
              placeholder="Откуда"
              className="flex-1 border rounded-lg px-4 py-2"
            />
            <input
              placeholder="Куда"
              className="flex-1 border rounded-lg px-4 py-2"
            />
            <button className="bg-black text-white px-6 py-2 rounded-lg hover:opacity-90 transition">
              Найти
            </button>
          </div>
        </div>
      </section>

      {/* Routes */}
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-6">
        {routes.length > 0 ? (
          routes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-2xl shadow-md p-8 flex justify-between items-center hover:shadow-xl transition"
            >
              <div>
                <div className="text-2xl font-semibold">
                  {route.from_city} → {route.to_city}
                </div>
                <div className="text-gray-500 mt-2">
                  {route.courier_name} · до {route.max_weight} кг
                </div>
              </div>

              <button className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 transition">
                Выбрать
              </button>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
            Маршруты пока недоступны. Проверьте переменные окружения Supabase на
            Vercel.
          </div>
        )}
      </section>
    </main>
  )
}
