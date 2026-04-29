import ActiveOrderCard from "./ActiveOrderCard"
import OrderCard from "./OrderCard"
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
    }
  })

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
