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
      className="rounded-xl bg-gray-800 px-4 py-2 transition hover:opacity-90"
    >
      На главную
    </Link>
  )
}
