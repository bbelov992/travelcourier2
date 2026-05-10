import ActiveOrderCard from "./ActiveOrderCard"
import OrderCard from "./OrderCard"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  isActiveOrderStatus,
  isFinishedOrderStatus,
} from "@/lib/order-status"

export const dynamic = "force-dynamic"

function isSchemaMismatchError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false
  }

  const details = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase()

  return (
    details.includes("pgrst204") ||
    details.includes("schema cache") ||
    details.includes("column")
  )
}

type Route = {
  id: string
  from_city: string
  to_city: string
}

type CourierProfile = {
  role: string
  full_name?: string | null
  rating?: number | null
  completed_deliveries?: number | null
  is_verified?: boolean | null
}

type Request = {
  id: string
  route_id: string
  sender_id: string
  sender_name?: string | null
  contact?: string | null
  description?: string | null
  weight?: number | null
  message?: string | null
  status: string
}

type ActiveOrder = {
  id: string
  route_id: string
  sender_id: string
  sender_name?: string | null
  contact?: string | null
  description?: string | null
  weight?: number | null
  message?: string | null
  request_id?: string | null
  status: string
  review?: OrderReview | null
}

type OrderReview = {
  id: string
  order_id: string
  rating: number
  comment: string | null
  created_at: string | null
}

function formatDate(date: string | null | undefined) {
  return date ? new Date(date).toLocaleDateString("ru-RU") : "Дата не указана"
}

function routeTitle(route: Route | undefined) {
  return route ? `${route.from_city} → ${route.to_city}` : "Маршрут не найден"
}

export default async function CourierPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, rating, completed_deliveries, is_verified")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "courier") {
    redirect("/")
  }

  const courierProfile = profile as CourierProfile

  const { data: routes } = await supabase
    .from("routes")
    .select("*")
    .eq("courier_id", user.id)
    .order("id", { ascending: false })

  const typedRoutes = (routes ?? []) as Route[]

  const routeIds = typedRoutes.map((route) => route.id)

  const requestsWithFullPayload = routeIds.length
    ? await supabase
        .from("requests")
        .select(
          "id, route_id, sender_id, sender_name, contact, description, weight, message, status"
        )
        .in("route_id", routeIds)
        .in("status", ["pending", "accepted"])
        .order("id", { ascending: false })
    : { data: [], error: null }

  const requestsResult =
    requestsWithFullPayload.error &&
    isSchemaMismatchError(requestsWithFullPayload.error)
      ? await supabase
          .from("requests")
          .select("id, route_id, sender_id, weight, message, status")
          .in("route_id", routeIds)
          .in("status", ["pending", "accepted"])
          .order("id", { ascending: false })
      : requestsWithFullPayload

  const typedRequests = (requestsResult.data ?? []) as Request[]
  const ordersWithFullPayload = routeIds.length
    ? await supabase
        .from("orders")
        .select(
          "id, route_id, sender_id, sender_name, contact, description, weight, message, request_id, status"
        )
        .in("route_id", routeIds)
        .order("id", { ascending: false })
    : { data: [], error: null }

  const ordersResult =
    ordersWithFullPayload.error &&
    isSchemaMismatchError(ordersWithFullPayload.error)
      ? await supabase
          .from("orders")
          .select("id, route_id, sender_id, request_id, status")
          .in("route_id", routeIds)
          .order("id", { ascending: false })
      : ordersWithFullPayload

  const rawOrders = (ordersResult.data ?? []) as ActiveOrder[]
  const orderRequestIds = new Set(
    rawOrders
      .map((order) => order.request_id)
      .filter((requestId): requestId is string => Boolean(requestId))
  )
  const { data: linkedRequests } = orderRequestIds.size
    ? await supabase
        .from("requests")
        .select(
          "id, route_id, sender_name, contact, description, weight, message"
        )
        .in("id", [...orderRequestIds])
    : { data: [] }

  const linkedRequestsById = Object.fromEntries(
    ((linkedRequests ?? []) as Request[]).map((request) => [request.id, request])
  )
  const completedOrderIds = rawOrders
    .filter((order) => order.status === "completed")
    .map((order) => order.id)
  const { data: reviewRows } = completedOrderIds.length
    ? await supabase
        .from("reviews")
        .select("id, order_id, rating, comment, created_at")
        .eq("courier_id", user.id)
        .in("order_id", completedOrderIds)
        .order("created_at", { ascending: false })
    : { data: [] }
  const reviews = (reviewRows ?? []) as OrderReview[]
  const reviewsByOrderId = Object.fromEntries(
    reviews.map((review) => [review.order_id, review])
  )
  const typedOrders = rawOrders.map((order) => {
    const linkedRequest =
      order.request_id ? linkedRequestsById[order.request_id] : undefined

    return {
      ...order,
      route_id: order.route_id ?? linkedRequest?.route_id ?? "",
      sender_name: order.sender_name ?? linkedRequest?.sender_name ?? null,
      contact: order.contact ?? linkedRequest?.contact ?? null,
      description: order.description ?? linkedRequest?.description ?? null,
      weight: order.weight ?? linkedRequest?.weight ?? null,
      message: order.message ?? linkedRequest?.message ?? null,
      review: reviewsByOrderId[order.id] ?? null,
    }
  })
  const routesById = Object.fromEntries(
    typedRoutes.map((route) => [route.id, route])
  )
  const reviewCount = reviews.length
  const rating = Number(courierProfile.rating ?? 0)

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-black">
            Кабинет курьера
          </h1>

          <Link
            href={`/courier/${user.id}`}
            className="inline-flex w-fit rounded-xl bg-white px-4 py-2 text-sm font-medium text-black shadow-sm transition hover:opacity-90"
          >
            Посмотреть публичный профиль
          </Link>
        </div>

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Профиль курьера
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-black">
                {courierProfile.full_name || "Курьер"}
              </h2>
              <p className="mt-2 text-gray-600">
                Здесь видны ваш рейтинг, завершенные доставки и отзывы
                отправителей.
              </p>
            </div>

            {courierProfile.is_verified && (
              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                Профиль проверен
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-amber-800">Рейтинг</p>
              <p className="mt-1 text-2xl font-semibold text-black">
                {rating > 0 ? rating.toFixed(1) : "Нет оценок"}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-800">Завершенные доставки</p>
              <p className="mt-1 text-2xl font-semibold text-black">
                {courierProfile.completed_deliveries ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-sky-50 p-4">
              <p className="text-sm text-sky-800">Отзывы</p>
              <p className="mt-1 text-2xl font-semibold text-black">
                {reviewCount}
              </p>
            </div>
          </div>
        </section>

        {reviews.length > 0 && (
          <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-black">Отзывы</h2>
            <div className="mt-4 space-y-3">
              {reviews.map((review) => {
                const order = typedOrders.find(
                  (typedOrder) => typedOrder.id === review.order_id
                )
                const route = order?.route_id ? routesById[order.route_id] : undefined

                return (
                  <div
                    key={review.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-black">
                        {routeTitle(route)}
                      </p>
                      <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                        {review.rating}/5
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {order?.sender_name || "Отправитель"} ·{" "}
                      {formatDate(review.created_at)}
                    </p>

                    <p className="mt-3 text-black">
                      {review.comment || "Отзыв без комментария"}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {typedRoutes.length === 0 && (
          <p className="text-gray-500">
            У вас пока нет созданных маршрутов.
          </p>
        )}

        {typedRoutes.map((route) => {
          const routeRequests = typedRequests.filter((request) => {
            if (request.route_id !== route.id) {
              return false
            }

            if (request.status === "pending") {
              return true
            }

            return !orderRequestIds.has(request.id)
          })
          const routeOrders = typedOrders.filter(
            (order) =>
              order.route_id === route.id && isActiveOrderStatus(order.status)
          )
          const routeFinishedOrders = typedOrders.filter(
            (order) =>
              order.route_id === route.id && isFinishedOrderStatus(order.status)
          )

          return (
            <div
              key={route.id}
              className="bg-white rounded-2xl p-6 shadow-sm mb-6"
            >
              <h2 className="text-xl font-semibold text-black mb-4">
                {route.from_city} → {route.to_city}
              </h2>

              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Новые заявки
                </h3>

                {routeRequests.length === 0 && (
                  <p className="text-gray-500">Нет новых заявок</p>
                )}

                {routeRequests.map((request) => (
                  <OrderCard key={request.id} order={request} courierId={user.id} />
                ))}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Активные заказы
                </h3>

                {routeOrders.length === 0 && (
                  <p className="text-gray-500">Нет активных заказов</p>
                )}

                {routeOrders.map((order) => (
                  <ActiveOrderCard key={order.id} order={order} />
                ))}
              </div>

              {routeFinishedOrders.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Завершенные заказы
                  </h3>

                  {routeFinishedOrders.map((order) => (
                    <ActiveOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
