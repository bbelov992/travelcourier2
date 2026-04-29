export const ORDER_STATUS_LABELS: Record<string, string> = {
  active: "Заказ создан",
  in_transit: "В пути",
  completion_requested: "Ожидает подтверждения",
  completed: "Доставлен",
  cancelled: "Отменен",
}

export const ORDER_STATUS_BADGE_STYLES: Record<string, string> = {
  active: "bg-sky-100 text-sky-800",
  in_transit: "bg-blue-100 text-blue-800",
  completion_requested: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
}

export const ORDER_ACTIVE_STATUSES = [
  "active",
  "in_transit",
  "completion_requested",
] as const

export const ORDER_FINISHED_STATUSES = [
  "completed",
  "cancelled",
] as const

export function isActiveOrderStatus(status: string | null | undefined) {
  return ORDER_ACTIVE_STATUSES.includes(
    status as (typeof ORDER_ACTIVE_STATUSES)[number]
  )
}

export function isFinishedOrderStatus(status: string | null | undefined) {
  return ORDER_FINISHED_STATUSES.includes(
    status as (typeof ORDER_FINISHED_STATUSES)[number]
  )
}

export function getOrderTimelineIndex(status: string | null | undefined) {
  switch (status) {
    case "active":
      return 0
    case "in_transit":
      return 1
    case "completion_requested":
    case "completed":
      return 2
    default:
      return 0
  }
}
