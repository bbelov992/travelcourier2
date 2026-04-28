import HomePageClient from "@/components/HomePageClient"
import { createSupabaseServerClient } from "@/lib/supabase-server"

type RouteCard = {
  id: string
  from_city: string
  to_city: string
  courier_name: string | null
  max_weight: number | null
  departure_date: string | null
}

type ViewerRole = "sender" | "courier" | null

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("routes")
    .select("id, from_city, to_city, courier_name, max_weight, departure_date")
    .order("id", { ascending: false })

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

  return (
    <HomePageClient
      initialRoutes={(data ?? []) as RouteCard[]}
      loadError={error ? "Не удалось загрузить маршруты" : null}
      viewerRole={viewerRole}
    />
  )
}
