import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const transportLabels: Record<string, string> = {
  plane: "Самолет",
  train: "Поезд",
  car: "Авто",
  bus: "Автобус",
  other: "Другое",
}

function formatPrice(amount?: number | null, currency?: string | null) {
  return amount === null || amount === undefined
    ? "Договорная"
    : `${amount} ${currency || "EUR"}`
}

export default async function RoutePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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
          <p><strong>Цена:</strong> {formatPrice(route.price_amount, route.price_currency)}</p>
          <p>
            <strong>Транспорт:</strong>{" "}
            {transportLabels[route.transport_type] ?? "Другое"}
          </p>
          {route.departure_time && (
            <p><strong>Время:</strong> {String(route.departure_time).slice(0, 5)}</p>
          )}
          {route.courier_comment && (
            <p><strong>Комментарий:</strong> {route.courier_comment}</p>
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
