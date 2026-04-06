export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f2f2f2] text-black">
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div
          className="h-[520px] w-[620px] rotate-[-18deg] rounded-[42%_58%_55%_45%/48%_40%_60%_52%] blur-[18px]"
          style={{
            background: `
              radial-gradient(circle at 35% 28%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 18%, transparent 38%),
              radial-gradient(circle at 67% 32%, rgba(210,190,255,0.85) 0%, transparent 32%),
              radial-gradient(circle at 42% 78%, rgba(255,198,226,0.78) 0%, transparent 30%),
              radial-gradient(circle at 62% 70%, rgba(199,238,255,0.72) 0%, transparent 28%),
              radial-gradient(circle at 52% 52%, rgba(210,205,220,0.55) 0%, transparent 26%),
              linear-gradient(135deg, rgba(255,255,255,0.92), rgba(232,228,238,0.88) 38%, rgba(245,221,233,0.86) 62%, rgba(229,239,246,0.84) 100%)
            `,
            boxShadow:
              "0 30px 80px rgba(255,255,255,0.65), 0 10px 30px rgba(180,180,190,0.18)",
          }}
        />
      </div>

      <header className="flex items-center justify-between px-6 py-5">
        <h1 className="text-xl font-semibold">✈️ Travel Courier</h1>

        <button
          className="rounded-xl px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(0,0,0,0.08)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(229,231,235,0.95) 100%)",
          }}
        >
          Войти
        </button>
      </header>

      <section className="mx-auto mt-16 max-w-5xl px-6">
        <h2 className="text-center text-5xl font-semibold">
          Доставка через путешественников
        </h2>

        <p className="mt-4 text-center text-xl text-black/55">
          Быстро, безопасно и дешевле курьерских служб
        </p>

        <div className="mt-12 rounded-[28px] bg-white/55 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <div className="grid gap-3 md:grid-cols-4">
            <input className="rounded-xl bg-white/70 p-4 outline-none" placeholder="Откуда" />
            <input className="rounded-xl bg-white/70 p-4 outline-none" placeholder="Куда" />
            <input className="rounded-xl bg-white/70 p-4 outline-none" placeholder="Дата" />
            <button
              className="rounded-xl font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(0,0,0,0.08)]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(245,246,248,1) 0%, rgba(212,216,223,1) 100%)",
              }}
            >
              Найти
            </button>
          </div>
        </div>

        <div className="mt-12 rounded-[24px] bg-white/60 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold">Berlin → Paris</div>
              <div className="mt-2 text-black/45">Anna · до 3 кг</div>
            </div>

            <button
              className="rounded-xl px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(0,0,0,0.08)]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(245,246,248,1) 0%, rgba(212,216,223,1) 100%)",
              }}
            >
              Выбрать
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}