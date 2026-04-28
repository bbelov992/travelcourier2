"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function HeaderHomeLink() {
  const pathname = usePathname()

  if (pathname === "/") {
    return null
  }

  return (
    <Link
      href="/"
      className="rounded-xl border border-white/25 bg-white/12 px-4 py-2 font-medium text-white transition hover:bg-white/18"
    >
      На главную
    </Link>
  )
}
