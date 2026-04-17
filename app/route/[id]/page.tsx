import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function RoutePage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params

  const { data: route, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !route) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">
          {route.from_city} → {route.to_city}
        </h1>

        <div className="space-y-3 text-lg">
          <p><strong>Максимальный вес:</strong> {route.max_weight} кг</p>
          {route.price && (
            <p><strong>Цена:</strong> €{route.price}</p>
          )}
        </div>
        <div className="mt-6">
          <Link
            href={`/route/${id}/request`}
            className="inline-block bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
          >
            Оставить заявку
          </Link>
        </div>
      </div>
    </main>
  )
}