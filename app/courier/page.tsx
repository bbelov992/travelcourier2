import ActiveOrderCard from "./ActiveOrderCard"
import OrderCard from "./OrderCard"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

type Route = {
  id: string
  from_city: string
  to_city: string
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
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "courier") {
    redirect("/")
  }

  const { data: routes } = await supabase
    .from("routes")
    .select("*")
    .eq("courier_id", user.id)
    .order("id", { ascending: false })

  const typedRoutes = (routes ?? []) as Route[]

  const routeIds = typedRoutes.map((route) => route.id)

  const { data: requests } = routeIds.length
    ? await supabase
        .from("requests")
        .select("*")
        .in("route_id", routeIds)
        .in("status", ["pending", "accepted"])
        .order("id", { ascending: false })
    : { data: [] }

  const typedRequests = (requests ?? []) as Request[]
  const { data: orders } = routeIds.length
    ? await supabase
        .from("orders")
        .select(
          "id, route_id, sender_id, sender_name, contact, description, weight, message, request_id, status"
        )
        .in("route_id", routeIds)
        .eq("status", "active")
        .order("id", { ascending: false })
    : { data: [] }

  const typedOrders = (orders ?? []) as ActiveOrder[]
  const activeOrderRequestIds = new Set(
    typedOrders
      .map((order) => order.request_id)
      .filter((requestId): requestId is string => Boolean(requestId))
  )

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">
          Кабинет курьера
        </h1>

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

            return !activeOrderRequestIds.has(request.id)
          })
          const routeOrders = typedOrders.filter(
            (order) => order.route_id === route.id
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
                  <OrderCard key={request.id} order={request} />
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
            </div>
          )
        })}
      </div>
    </main>
  )
}
