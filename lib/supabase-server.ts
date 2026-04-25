import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptionsWithName) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Cookie writes are ignored during Server Component rendering.
          }
        },
        remove(name: string, options: CookieOptionsWithName) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch {
            // Cookie writes are ignored during Server Component rendering.
          }
        },
      },
    }
  )
}
