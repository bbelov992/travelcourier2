import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import HeaderHomeLink from '@/components/HeaderHomeLink'

export default async function Header() {
  async function logout() {
    'use server'

    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null }
  const profileHref =
    profile?.role === "courier"
      ? "/courier"
      : profile?.role === "sender"
        ? "/sender"
        : "/dashboard"

  return (
    <header className="border-b border-white/15 bg-[#2e6bff] px-6 py-4 text-white shadow-[0_18px_40px_rgba(46,107,255,0.18)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-[118px]">
          <HeaderHomeLink />
        </div>

        <div className="flex gap-3">
          {user ? (
            <>
              <Link
                href={profileHref}
                className="rounded-xl bg-white px-4 py-2 font-medium text-[#16357f] transition hover:bg-[#eef3ff]"
              >
                Мой профиль
              </Link>

              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-xl border border-white/25 bg-white/12 px-4 py-2 font-medium text-white transition hover:bg-white/18"
                >
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl bg-white px-4 py-2 font-medium text-[#16357f] transition hover:bg-[#eef3ff]"
              >
                Войти
              </Link>

              <Link
                href="/signup"
                className="rounded-xl border border-white/25 bg-white/12 px-4 py-2 font-medium text-white transition hover:bg-white/18"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
