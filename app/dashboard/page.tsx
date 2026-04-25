import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
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

  if (profile?.role === "courier") {
    redirect("/courier")
  }

  if (profile?.role === "sender") {
    redirect("/sender")
  }

  redirect("/")
}
