const timelineSteps = [
  {
    label: "Заказ принят",
    description: "Курьер принял заявку",
  },
  {
    label: "В пути",
    description: "Посылка у курьера",
  },
  {
    label: "Подтверждение",
    description: "Финальное подтверждение отправителем",
  },
]

function getStepState(status: string | null | undefined, index: number) {
  if (status === "completed") {
    return "done"
  }

  if (index === 0 && status) {
    return "done"
  }

  if (index === 1) {
    return status === "in_transit" || status === "completion_requested"
      ? "done"
      : "idle"
  }

  if (index === 2 && status === "completion_requested") {
    return "waiting"
  }

  return "idle"
}

export default function OrderStatusTimeline({
  status,
  compact = false,
}: {
  status: string | null | undefined
  compact?: boolean
}) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
        Заказ отменен
      </div>
    )
  }

  return (
    <div
      className={`grid gap-3 ${
        compact ? "md:grid-cols-3" : "md:grid-cols-[1fr_auto_1fr_auto_1fr]"
      }`}
    >
      {timelineSteps.map((step, index) => {
        const state = getStepState(status, index)
        const isDone = state === "done"
        const isWaiting = state === "waiting"
        const isConnectorDone =
          index < 2 &&
          (getStepState(status, index) === "done" ||
            getStepState(status, index + 1) === "done" ||
            getStepState(status, index + 1) === "waiting")

        let nodeClassName = "border-gray-200 bg-white text-gray-400"
        let labelClassName = "text-gray-500"
        let icon = String(index + 1)

        if (isDone) {
          nodeClassName = "border-emerald-200 bg-emerald-500 text-white"
          labelClassName = "text-emerald-800"
          icon = "✓"
        } else if (isWaiting) {
          nodeClassName = "border-amber-200 bg-amber-100 text-amber-800"
          labelClassName = "text-amber-800"
          icon = "⏱"
        }

        return (
          <div key={step.label} className="contents">
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white p-3 ${
                compact ? "" : "md:flex-col md:items-center md:text-center"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${nodeClassName}`}
                aria-hidden="true"
              >
                {icon}
              </span>

              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${labelClassName}`}>
                  {step.label}
                </span>
                {!compact && (
                  <span className="mt-1 block text-xs leading-5 text-gray-500">
                    {step.description}
                  </span>
                )}
              </span>
            </div>

            {!compact && index < 2 && (
              <div className="hidden items-center md:flex" aria-hidden="true">
                <div
                  className={`h-0.5 w-12 ${
                    isConnectorDone ? "bg-emerald-400" : "bg-gray-200"
                  }`}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
