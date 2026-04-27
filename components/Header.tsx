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
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <header className="flex items-center justify-between bg-black px-6 py-4 text-white">
      <div className="min-w-[118px]">
        <HeaderHomeLink />
      </div>

      <div className="flex gap-3">
        {session ? (
          <>
            <Link
              href="/dashboard"
              className="rounded-xl bg-gray-800 px-4 py-2 transition hover:opacity-90"
            >
              Мой профиль
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="rounded-xl bg-gray-700 px-4 py-2 transition hover:opacity-90"
              >
                Выйти
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-xl bg-gray-800 px-4 py-2 transition hover:opacity-90"
            >
              Войти
            </Link>

            <Link
              href="/signup"
              className="rounded-xl bg-gray-700 px-4 py-2 transition hover:opacity-90"
            >
              Регистрация
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
