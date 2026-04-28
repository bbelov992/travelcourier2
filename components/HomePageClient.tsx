"use client"

import Link from "next/link"
import { type FormEvent, useMemo, useState } from "react"

type RouteCard = {
  id: string
  from_city: string
  to_city: string
  courier_name: string | null
  max_weight: number | null
  departure_date: string | null
}

type ViewerRole = "sender" | "courier" | null
type HomeMode = "sender" | "courier"

type HomePageClientProps = {
  initialRoutes: RouteCard[]
  loadError: string | null
  viewerRole: ViewerRole
}

const senderHighlights = [
  "Ищите попутный маршрут по городу и дате",
  "Оплачивайте только тогда, когда нашли подходящего курьера",
  "Контакт открывается только после принятия заявки",
]

const courierBenefits = [
  {
    title: "Свободное место приносит доход",
    description: "Публикуете перелет или поездку и получаете заявки от отправителей.",
  },
  {
    title: "Маршрут создается за пару минут",
    description: "Достаточно указать направление, дату и допустимый вес.",
  },
  {
    title: "Вся работа в одном кабинете",
    description: "Новые заявки, активные заказы и статусы уже собраны по маршрутам.",
  },
]

function formatDepartureDate(date: string | null) {
  if (!date) {
    return "Дата не указана"
  }

  return new Date(date).toLocaleDateString("ru-RU")
}

export default function HomePageClient({
  initialRoutes,
  loadError,
  viewerRole,
}: HomePageClientProps) {
  const [mode, setMode] = useState<HomeMode>(
    viewerRole === "courier" ? "courier" : "sender"
  )
  const [draftFilters, setDraftFilters] = useState({
    from: "",
    to: "",
    date: "",
  })
  const [activeFilters, setActiveFilters] = useState({
    from: "",
    to: "",
    date: "",
  })

  const filteredRoutes = useMemo(() => {
    return initialRoutes.filter((route) => {
      const matchFrom =
        !activeFilters.from ||
        route.from_city.toLowerCase().includes(activeFilters.from.toLowerCase())

      const matchTo =
        !activeFilters.to ||
        route.to_city.toLowerCase().includes(activeFilters.to.toLowerCase())

      const matchDate =
        !activeFilters.date || route.departure_date === activeFilters.date

      return matchFrom && matchTo && matchDate
    })
  }, [activeFilters, initialRoutes])

  const hasFilters = Boolean(
    draftFilters.from ||
      draftFilters.to ||
      draftFilters.date ||
      activeFilters.from ||
      activeFilters.to ||
      activeFilters.date
  )

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActiveFilters(draftFilters)
  }

  const resetFilters = () => {
    const emptyFilters = {
      from: "",
      to: "",
      date: "",
    }

    setDraftFilters(emptyFilters)
    setActiveFilters(emptyFilters)
  }

  const latestRoutes = initialRoutes.slice(0, 3)
  const courierPrimaryHref = viewerRole === "courier" ? "/courier" : "/create-route"
  const courierPrimaryLabel =
    viewerRole === "courier" ? "Открыть кабинет курьера" : "Создать маршрут"
  const courierSecondaryHref = viewerRole === "courier" ? "/create-route" : "/signup"
  const courierSecondaryLabel =
    viewerRole === "courier"
      ? "Опубликовать новый маршрут"
      : "Зарегистрироваться как курьер"

  return (
    <main className="min-h-screen bg-[#eef3ff] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[36px] bg-[#2e6bff] px-6 py-8 text-white shadow-[0_30px_80px_rgba(46,107,255,0.25)] sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(76,221,255,0.24),_transparent_30%)]" />
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-12 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto max-w-4xl">
            <h1 className="text-center text-3xl font-semibold leading-tight sm:text-4xl">
              Найди подходящий маршрут для своей посылки
            </h1>

            <div className="mt-7 flex justify-center">
              <div className="inline-flex rounded-2xl bg-[#2555cc] p-1 shadow-lg shadow-black/10 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setMode("sender")}
                  aria-pressed={mode === "sender"}
                  className={`rounded-[18px] px-5 py-3 text-sm font-medium transition sm:px-6 ${
                    mode === "sender"
                      ? "bg-white text-[#16357f] shadow-sm"
                      : "text-white/82 hover:text-white"
                  }`}
                >
                  Я отправитель
                </button>

                <button
                  type="button"
                  onClick={() => setMode("courier")}
                  aria-pressed={mode === "courier"}
                  className={`rounded-[18px] px-5 py-3 text-sm font-medium transition sm:px-6 ${
                    mode === "courier"
                      ? "bg-white text-[#16357f] shadow-sm"
                      : "text-white/82 hover:text-white"
                  }`}
                >
                  Я курьер
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              className="mt-6 rounded-[30px] bg-white p-5 text-black shadow-[0_24px_60px_rgba(18,31,76,0.16)] sm:p-6"
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#5a6a93]">
                    Поиск маршрутов
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#0f172f]">
                    {mode === "sender"
                      ? "Подберите доставку по направлению и дате"
                      : "Смотрите рынок как отправитель и переключайтесь в режим курьера ниже"}
                  </h2>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <input
                  aria-label="Город отправления"
                  placeholder="Откуда"
                  value={draftFilters.from}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-[#d8e0f5] px-4 py-3 text-black outline-none transition focus:border-[#2e6bff]"
                />

                <input
                  aria-label="Город назначения"
                  placeholder="Куда"
                  value={draftFilters.to}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-[#d8e0f5] px-4 py-3 text-black outline-none transition focus:border-[#2e6bff]"
                />

                <input
                  aria-label="Дата поездки"
                  type="date"
                  value={draftFilters.date}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-[#d8e0f5] px-4 py-3 text-black outline-none transition focus:border-[#2e6bff]"
                />

                <button
                  type="submit"
                  className="rounded-2xl bg-[#ff8743] px-4 py-3 font-medium text-white transition hover:brightness-95"
                >
                  Найти маршрут
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasFilters}
                  className="rounded-2xl border border-[#d8e0f5] px-4 py-3 text-sm font-medium text-[#0f172f] transition hover:bg-[#f5f7ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Сбросить фильтры
                </button>
              </div>
            </form>
          </div>
        </section>

        {mode === "sender" ? (
          <section id="routes" className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#5a6a93]">
                  Доступные маршруты
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-[#0f172f]">
                  Выберите путешественника под свою отправку
                </h2>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#405072] shadow-sm">
                Найдено маршрутов: {filteredRoutes.length}
              </div>
            </div>

            {loadError && (
              <div className="rounded-[28px] bg-white p-6 text-center text-[#0f172f] shadow-sm">
                <p className="mb-4">
                  Не удалось загрузить маршруты. Попробуйте еще раз.
                </p>

                <Link
                  href="/"
                  className="inline-flex rounded-2xl bg-[#0f172f] px-5 py-2 text-sm text-white transition hover:opacity-90"
                >
                  Обновить страницу
                </Link>
              </div>
            )}

            {!loadError && filteredRoutes.length === 0 && (
              <div className="rounded-[28px] bg-white p-6 text-center text-[#0f172f] shadow-sm">
                Маршруты не найдены
              </div>
            )}

            {!loadError && filteredRoutes.length > 0 && (
              <div className="grid gap-4">
                {filteredRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="flex flex-col gap-4 rounded-[24px] bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xl font-semibold text-[#0f172f] sm:text-2xl">
                        {route.from_city} → {route.to_city}
                      </p>
                    </div>

                    <div className="grid gap-1 text-sm text-[#405072] md:min-w-[240px]">
                      <p>
                        <span className="font-medium text-[#0f172f]">Курьер:</span>{" "}
                        {route.courier_name || "Не указан"}
                      </p>
                      <p>
                        <span className="font-medium text-[#0f172f]">Дата:</span>{" "}
                        {formatDepartureDate(route.departure_date)}
                      </p>
                      <p>
                        <span className="font-medium text-[#0f172f]">Вес:</span>{" "}
                        {route.max_weight ? `${route.max_weight} кг` : "Не указан"}
                      </p>
                    </div>

                    <Link
                      href={`/route/${route.id}/request`}
                      className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#0f172f] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Оставить заявку
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              {senderHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] bg-white p-5 text-sm font-medium leading-6 text-[#0f172f] shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[30px] bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#5a6a93]">
                Что важно курьеру
              </p>

              <div className="mt-5 grid gap-3">
                {courierBenefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="rounded-[24px] bg-[#f4f7ff] p-5"
                  >
                    <p className="text-lg font-semibold text-[#0f172f]">
                      {benefit.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5a6a93]">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-[#0f172f] p-6 text-white shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/55">
                Следующий шаг
              </p>

              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                Курьеру нужен не поиск, а понятный вход в работу
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/75">
                Поэтому на главной у курьера теперь свой сценарий: отдельный
                режим, отдельные CTA и объяснение, как устроен поток заявок.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={courierPrimaryHref}
                  className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-medium text-[#0f172f] transition hover:bg-[#eef3ff]"
                >
                  {courierPrimaryLabel}
                </Link>

                <Link
                  href={courierSecondaryHref}
                  className="rounded-2xl border border-white/15 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-white/6"
                >
                  {courierSecondaryLabel}
                </Link>
              </div>
            </div>

            {latestRoutes.length > 0 && (
              <div className="rounded-[30px] bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#5a6a93]">
                      Примеры маршрутов
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#0f172f]">
                      Так сейчас выглядит живая витрина платформы
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode("sender")}
                    className="text-sm font-medium text-[#1d47b7]"
                  >
                    Переключиться в режим отправителя
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {latestRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="rounded-[24px] border border-[#e7ecfb] p-5"
                    >
                      <p className="text-lg font-semibold text-[#0f172f]">
                        {route.from_city} → {route.to_city}
                      </p>
                      <p className="mt-3 text-sm text-[#5a6a93]">
                        Курьер: {route.courier_name || "Не указан"}
                      </p>
                      <p className="mt-1 text-sm text-[#5a6a93]">
                        Дата: {formatDepartureDate(route.departure_date)}
                      </p>
                      <p className="mt-1 text-sm text-[#5a6a93]">
                        Вес: {route.max_weight ? `${route.max_weight} кг` : "Не указан"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
