import { getOrderTimelineIndex } from "@/lib/order-status"

const timelineSteps = ["Создан", "В пути", "Доставлен"]

export default function OrderStatusTimeline({
  status,
}: {
  status: string | null | undefined
}) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
        Заказ отменен
      </div>
    )
  }

  const currentIndex = getOrderTimelineIndex(status)

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {timelineSteps.map((step, index) => {
        const isCompleted = status === "completed" && index <= currentIndex
        const isCurrent = index === currentIndex && !isCompleted
        const isReached = index < currentIndex

        let stepClassName =
          "border border-gray-200 bg-white text-gray-400"

        if (isCompleted) {
          stepClassName =
            "border border-emerald-200 bg-emerald-100 text-emerald-800"
        } else if (status === "completion_requested" && isCurrent) {
          stepClassName =
            "border border-amber-200 bg-amber-100 text-amber-800"
        } else if (isCurrent || isReached) {
          stepClassName =
            "border border-blue-200 bg-blue-100 text-blue-800"
        }

        return (
          <div
            key={step}
            className={`rounded-xl px-4 py-3 text-sm font-medium ${stepClassName}`}
          >
            {index + 1}. {step}
          </div>
        )
      })}
    </div>
  )
}
