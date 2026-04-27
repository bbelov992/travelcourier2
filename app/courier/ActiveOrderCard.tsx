type ActiveOrder = {
  id: string
  sender_id: string
  sender_name?: string | null
  contact?: string | null
  description?: string | null
  weight?: number | null
  message?: string | null
  status: string
}

const activeStatusLabels: Record<string, string> = {
  active: "В работе",
  completed: "Доставлен",
  cancelled: "Отменен",
}

export default function ActiveOrderCard({ order }: { order: ActiveOrder }) {
  return (
    <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-emerald-700">
            Заказ #{String(order.id).slice(0, 8)}
          </p>
          <p className="font-medium text-black">
            Статус: {activeStatusLabels[order.status] ?? order.status}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <p className="text-sm text-gray-500">Отправитель</p>
          <p className="mt-1 text-black">{order.sender_name || "Не указан"}</p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-sm text-gray-500">Контакт</p>
          <p className="mt-1 text-black">{order.contact || "Не указан"}</p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-sm text-gray-500">Вес</p>
          <p className="mt-1 text-black">
            {order.weight ? `${order.weight} кг` : "Не указан"}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-sm text-gray-500">ID отправителя</p>
          <p className="mt-1 break-all text-black">{order.sender_id}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white p-3">
        <p className="text-sm text-gray-500">Описание посылки</p>
        <p className="mt-1 text-black">
          {order.description || "Описание не добавлено"}
        </p>
      </div>

      <div className="mt-3 rounded-xl bg-white p-3">
        <p className="text-sm text-gray-500">Комментарий</p>
        <p className="mt-1 text-black">
          {order.message || "Комментарий не добавлен"}
        </p>
      </div>
    </div>
  )
}
