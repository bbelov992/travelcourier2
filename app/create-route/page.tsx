import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export default function CreateRoutePage() {
  async function createRoute(formData: FormData) {
    "use server"

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const from_city = formData.get("from_city") as string
    const to_city = formData.get("to_city") as string
    const max_weight = Number(formData.get("max_weight"))
    const courier_name = formData.get("courier_name") as string

    const { error } = await supabase.from("routes").insert([
      {
        from_city,
        to_city,
        max_weight,
        courier_name,
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
            type="text"
            name="courier_name"
            required
            className="w-full border rounded-xl px-4 py-2 text-black"
            placeholder="Имя"
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