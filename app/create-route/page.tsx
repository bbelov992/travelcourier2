import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export default function CreateRoutePage() {
  async function createRoute(formData: FormData) {
    "use server"

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle()

    if (profile?.role !== "courier") {
      redirect("/")
    }

    const from_city = formData.get("from_city") as string
    const to_city = formData.get("to_city") as string
    const max_weight = Number(formData.get("max_weight"))
    const courier_name = profile.full_name?.trim() || user.email || "Курьер"
    const departure_date = formData.get("departure_date") as string
    const departure_time = (formData.get("departure_time") as string) || null
    const transport_type = formData.get("transport_type") as string
    const price_amount = formData.get("price_amount")
      ? Number(formData.get("price_amount"))
      : null
    const price_currency = (formData.get("price_currency") as string) || "EUR"
    const courier_comment =
      ((formData.get("courier_comment") as string) || "").trim() || null

    const { error } = await supabase.from("routes").insert([
      {
        from_city,
        to_city,
        max_weight,
        courier_name,
        departure_date,
        departure_time,
        transport_type,
        price_amount,
        price_currency,
        courier_comment,
        courier_id: user.id,
      },
    ])

    if (error) {
      console.error(error)
      throw new Error("Ошибка вставки")
    }

    redirect("/")
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-black mb-6 text-center">
          Создать новый маршрут
        </h1>

        <form action={createRoute} className="space-y-4">
          <input
            type="text"
            name="from_city"
            required
            className="w-full border rounded-xl px-4 py-2 text-black"
            placeholder="Откуда"
          />

          <input
            type="text"
            name="to_city"
            required
            className="w-full border rounded-xl px-4 py-2 text-black"
            placeholder="Куда"
          />

          <input
            type="number"
            name="max_weight"
            required
            className="w-full border rounded-xl px-4 py-2 text-black"
            placeholder="Вес"
          />

          <input
            type="date"
            name="departure_date"
            required
            className="w-full border rounded-xl px-4 py-2 text-black"
          />

          <input
            type="time"
            name="departure_time"
            className="w-full border rounded-xl px-4 py-2 text-black"
          />

          <select
            name="transport_type"
            defaultValue="other"
            className="w-full border rounded-xl px-4 py-2 text-black"
          >
            <option value="plane">Самолет</option>
            <option value="train">Поезд</option>
            <option value="car">Авто</option>
            <option value="bus">Автобус</option>
            <option value="other">Другое</option>
          </select>

          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <input
              type="number"
              name="price_amount"
              min="0"
              step="0.01"
              className="w-full border rounded-xl px-4 py-2 text-black"
              placeholder="Цена"
            />

            <select
              name="price_currency"
              defaultValue="EUR"
              className="w-full border rounded-xl px-4 py-2 text-black"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="RUB">RUB</option>
            </select>
          </div>

          <textarea
            name="courier_comment"
            className="w-full border rounded-xl px-4 py-2 text-black"
            placeholder="Комментарий для отправителей"
            rows={4}
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-xl"
          >
            Создать маршрут
          </button>
        </form>
      </div>
    </main>
  )
}
