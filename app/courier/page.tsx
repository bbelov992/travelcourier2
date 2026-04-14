import OrderCard from "./OrderCard"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function CourierPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    }
  )

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

  const routeIds = routes?.map((r) => r.id) || []

  const { data: orders } = routeIds.length
    ? await supabase
        .from("orders")
        .select("*")
        .in("route_id", routeIds)
        .order("id", { ascending: false })
    : { data: [] }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">
          Кабинет курьера
        </h1>

        {routes?.length === 0 && (
          <p className="text-gray-500">
            У вас пока нет созданных маршрутов.
          </p>
        )}

        {routes?.map((route) => {
          const routeOrders = orders?.filter(
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

              {routeOrders?.length === 0 && (
                <p className="text-gray-500">Нет заявок</p>
              )}

              {routeOrders?.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )
        })}
      </div>
    </main>
  )
}