import HomePageClient from "@/components/HomePageClient"
import { createSupabaseServerClient } from "@/lib/supabase-server"

type RouteCard = {
  id: string
  from_city: string
  to_city: string
  courier_id: string | null
  courier_name: string | null
  max_weight: number | null
  departure_date: string | null
  departure_time?: string | null
  transport_type?: string | null
  price_amount?: number | null
  price_currency?: string | null
  courier_comment?: string | null
  courier_rating?: number | null
  courier_completed_deliveries?: number | null
  courier_is_verified?: boolean | null
}

type ViewerRole = "sender" | "courier" | null

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

export default async function Home() {
  const supabase = await createSupabaseServerClient()

  const routesWithDetails = await supabase
    .from("routes")
    .select(
      "id, from_city, to_city, courier_id, courier_name, max_weight, departure_date, departure_time, transport_type, price_amount, price_currency, courier_comment"
    )
    .order("id", { ascending: false })
  const routesResult =
    routesWithDetails.error && isSchemaMismatchError(routesWithDetails.error)
      ? await supabase
          .from("routes")
          .select(
            "id, from_city, to_city, courier_id, courier_name, max_weight, departure_date"
          )
          .order("id", { ascending: false })
      : routesWithDetails
  const { data, error } = routesResult

  if (error) {
    console.error("Failed to load routes", error)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let viewerRole: ViewerRole = null

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Failed to load profile role", profileError)
    } else if (profile?.role === "sender" || profile?.role === "courier") {
      viewerRole = profile.role
    }
  }

  const routes = (data ?? []) as RouteCard[]
  const courierIds = [
    ...new Set(
      routes
        .map((route) => route.courier_id)
        .filter((courierId): courierId is string => Boolean(courierId))
    ),
  ]
  const { data: profiles } = courierIds.length
    ? await supabase
        .from("profiles")
        .select("id, rating, completed_deliveries, is_verified")
        .in("id", courierIds)
    : { data: [] }
  const profilesById = Object.fromEntries(
    ((profiles ?? []) as Array<{
      id: string
      rating: number | null
      completed_deliveries: number | null
      is_verified: boolean | null
    }>).map((profile) => [profile.id, profile])
  )
  const enrichedRoutes = routes.map((route) => {
    const courierProfile = route.courier_id
      ? profilesById[route.courier_id]
      : undefined

    return {
      ...route,
      courier_rating: courierProfile?.rating ?? null,
      courier_completed_deliveries:
        courierProfile?.completed_deliveries ?? null,
      courier_is_verified: courierProfile?.is_verified ?? null,
    }
  })

  return (
    <HomePageClient
      initialRoutes={enrichedRoutes}
      loadError={error ? "Не удалось загрузить маршруты" : null}
      viewerRole={viewerRole}
    />
  )
}
