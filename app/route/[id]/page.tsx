import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function RoutePage(
  { params }: { params: { id: string } }
) 

export default async function RoutePage({ params }: RoutePageProps) {
  const { data: route, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !route) {
    return notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">
          {route.from_city} → {route.to_city}
        </h1>

        <div className="space-y-3 text-lg">
          <p><strong>Курьер:</strong> {route.courier_name}</p>
          <p><strong>Максимальный вес:</strong> {route.max_weight} кг</p>
          {route.price && (
            <p><strong>Цена:</strong> {route.price} €</p>
          )}
          {route.departure_date && (
            <p><strong>Дата отправления:</strong> {new Date(route.departure_date).toLocaleDateString()}</p>
          )}
          {route.description && (
            <p><strong>Описание:</strong> {route.description}</p>
          )}
        </div>

        <button className="mt-8 w-full bg-black text-white py-3 rounded-xl hover:opacity-90 transition">
          Оставить заявку на доставку
        </button>
      </div>
    </main>
  )
}