import { createClient } from "@/lib/supabase"

export default async function Home() {
  const supabase = createClient()

  const { data: routes, error } = await supabase
    .from("routes")
    .select("*")
    .order("id", { ascending: false })

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold text-center text-black mb-3">
          Доставка через путешественников
        </h1>

        <p className="text-center text-black mb-10">
          Быстро, безопасно и дешевле курьерских служб
        </p>

        {/* Фильтр + Создать маршрут */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-10">

          <div className="bg-white shadow-md rounded-2xl p-6 grid md:grid-cols-4 gap-4 flex-1">
            <input
              placeholder="Откуда"
              className="border rounded-xl px-4 py-3 text-black placeholder-black"
            />

            <input
              placeholder="Куда"
              className="border rounded-xl px-4 py-3 text-black placeholder-black"
            />

            <input
              type="date"
              className="border rounded-xl px-4 py-3 text-black"
            />

            <button className="bg-black text-white rounded-xl py-3 hover:opacity-90 transition">
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

        {/* Список маршрутов */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl">
              Ошибка загрузки маршрутов
            </div>
          )}

          {routes && routes.length === 0 && (
            <div className="bg-white shadow-sm rounded-2xl p-6 text-center text-gray-600">
              Пока нет доступных маршрутов. Создайте первый маршрут!
            </div>
          )}

          {routes?.map((route) => (
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
