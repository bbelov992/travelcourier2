export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: routes, error } = await supabase
    .from('routes')
    .select('*')

  console.log("ROUTES:", routes)

  if (error) {
    return <div className="p-10">Ошибка загрузки данных</div>
  }

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-6">
        Доставка через путешественников
      </h1>

      <div className="space-y-4">
        {routes?.map((route) => (
          <div
            key={route.id}
            className="p-6 bg-white rounded-xl shadow"
          >
            <div className="text-xl font-semibold">
              {route.from_city} → {route.to_city}
            </div>
            <div className="text-gray-500">
              {route.courier_name} · до {route.max_weight} кг
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}