import OrderCard from "./OrderCard"
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

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
  description?: string | null
  message?: string | null
  status: string
}

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
        set(name: string, value: string, options: CookieOptionsWithName) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptionsWithName) {
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
          const routeRequests = typedRequests.filter(
            (request) => request.route_id === route.id
          )

          return (
            <div
              key={route.id}
              className="bg-white rounded-2xl p-6 shadow-sm mb-6"
            >
              <h2 className="text-xl font-semibold text-black mb-4">
                {route.from_city} → {route.to_city}
              </h2>

              {routeRequests?.length === 0 && (
                <p className="text-gray-500">Нет заявок</p>
              )}

              {routeRequests?.map((request) => (
                <OrderCard key={request.id} order={request} />
              ))}
            </div>
          )
        })}
      </div>
    </main>
  )
}
