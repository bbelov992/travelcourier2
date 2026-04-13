export const dynamic = "force-dynamic"

import { supabase } from "@/lib/supabase"

export default async function CourierPage() {
  const { data: routes } = await supabase
    .from("routes")
    .select("*")
    .order("id", { ascending: false })

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("id", { ascending: false })

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold text-black mb-8">
          Кабинет курьера
        </h1>

        {routes?.map((route) => {
          const routeOrders = orders?.filter(
            (order) => order.route_id === route.id
          )

          return (
            <div
              key={route.id}
              className="bg-white rounded-2xl p-6 shadow-sm mb-6"
            >
              <h2 className="text-xl font-semibold text-black mb-4">
                {route.from_city} → {route.to_city}
              </h2>

              {routeOrders?.length === 0 && (
                <p className="text-gray-500">Нет заявок</p>
              )}

              {routeOrders?.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-xl p-4 mb-4"
                >
                  <p className="text-black">
                    Статус: {order.status}
                  </p>

                  {order.status === "accepted" && (
                    <div className="mt-2 text-black">
                      <p>Имя: {order.sender_name}</p>
                      <p>Email: {order.sender_email}</p>
                      <p>Сообщение: {order.massage}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </main>
  )
}