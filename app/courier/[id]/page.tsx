import Link from "next/link"
import { notFound } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

type CourierProfile = {
  id: string
  full_name: string | null
  rating: number | null
  completed_deliveries: number | null
  is_verified: boolean | null
  review_count: number | null
}

type CourierDelivery = {
  order_id: string
  route_id: string | null
  from_city: string | null
  to_city: string | null
  departure_date: string | null
  sender_name: string | null
  weight: number | null
  order_created_at: string | null
  review_id: string | null
  review_rating: number | null
  review_comment: string | null
  review_created_at: string | null
}

function formatDate(date: string | null | undefined) {
  return date ? new Date(date).toLocaleDateString("ru-RU") : "Дата не указана"
}

function formatRating(rating: number | null | undefined) {
  return rating && rating > 0 ? rating.toFixed(1) : "Нет оценок"
}

function routeTitle(delivery: CourierDelivery) {
  if (delivery.from_city || delivery.to_city) {
    return `${delivery.from_city ?? "—"} → ${delivery.to_city ?? "—"}`
  }

  return "Маршрут не найден"
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#eef3ff] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-medium text-[#0f172f] shadow-sm transition hover:opacity-90"
        >
          ← На главную
        </Link>

        <div className="mt-6 rounded-[24px] bg-white p-6 text-[#0f172f] shadow-sm">
          {message}
        </div>
      </div>
    </main>
  )
}

export default async function CourierProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: profileRows, error: profileError } = await supabase.rpc(
    "get_courier_public_profile",
    { courier_profile_id: id }
  )

  if (profileError) {
    console.error("Failed to load courier public profile", profileError)
    return (
      <ErrorState message="Профиль курьера временно недоступен. Попробуйте обновить страницу позже." />
    )
  }

  const profile = ((profileRows ?? []) as CourierProfile[])[0]

  if (!profile) {
    notFound()
  }

  const { data: deliveryRows, error: deliveriesError } = await supabase.rpc(
    "get_courier_public_deliveries",
    { courier_profile_id: id }
  )

  if (deliveriesError) {
    console.error("Failed to load courier public deliveries", deliveriesError)
  }

  const deliveries = (deliveryRows ?? []) as CourierDelivery[]
  const reviewedDeliveries = deliveries.filter((delivery) => delivery.review_id)

  return (
    <main className="min-h-screen bg-[#eef3ff] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-medium text-[#0f172f] shadow-sm transition hover:opacity-90"
        >
          ← На главную
        </Link>

        <section className="mt-6 rounded-[30px] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#5a6a93]">
                Профиль курьера
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[#0f172f] sm:text-4xl">
                {profile.full_name || "Курьер"}
              </h1>
            </div>

            {profile.is_verified && (
              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                Проверен
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-sm text-amber-800">Рейтинг</p>
              <p className="mt-1 text-2xl font-semibold text-[#0f172f]">
                {formatRating(profile.rating)}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-800">Выполненные доставки</p>
              <p className="mt-1 text-2xl font-semibold text-[#0f172f]">
                {profile.completed_deliveries ?? deliveries.length}
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-sky-800">Отзывы</p>
              <p className="mt-1 text-2xl font-semibold text-[#0f172f]">
                {profile.review_count ?? reviewedDeliveries.length}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#5a6a93]">
                История
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#0f172f]">
                Выполненные доставки и отзывы
              </h2>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#405072] shadow-sm">
              Записей: {deliveries.length}
            </div>
          </div>

          {deliveriesError && (
            <div className="rounded-[24px] bg-white p-6 text-[#0f172f] shadow-sm">
              Не удалось загрузить список доставок.
            </div>
          )}

          {!deliveriesError && deliveries.length === 0 && (
            <div className="rounded-[24px] bg-white p-6 text-center text-[#0f172f] shadow-sm">
              У курьера пока нет завершенных доставок.
            </div>
          )}

          {!deliveriesError && deliveries.length > 0 && (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <article
                  key={delivery.order_id}
                  className="rounded-[24px] bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-[#0f172f]">
                        {routeTitle(delivery)}
                      </p>
                      <p className="mt-2 text-sm text-[#5a6a93]">
                        {delivery.sender_name || "Отправитель"} ·{" "}
                        {formatDate(
                          delivery.review_created_at ??
                            delivery.departure_date ??
                            delivery.order_created_at
                        )}
                      </p>
                    </div>

                    {delivery.review_rating ? (
                      <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                        {delivery.review_rating}/5
                      </span>
                    ) : (
                      <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                        Без отзыва
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[#405072]">
                    <span className="rounded-full bg-[#eef3ff] px-3 py-1">
                      Заказ #{delivery.order_id.slice(0, 8)}
                    </span>
                    {delivery.weight ? (
                      <span className="rounded-full bg-[#eef3ff] px-3 py-1">
                        {delivery.weight} кг
                      </span>
                    ) : null}
                    {delivery.departure_date ? (
                      <span className="rounded-full bg-[#eef3ff] px-3 py-1">
                        {formatDate(delivery.departure_date)}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-[#0f172f]">
                    {delivery.review_comment || "Отзыв пока не оставлен."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
