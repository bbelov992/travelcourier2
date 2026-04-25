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

  return (
    <HomePageClient
      initialRoutes={(data ?? []) as RouteCard[]}
      loadError={error ? "Не удалось загрузить маршруты" : null}
    />
  )
}
