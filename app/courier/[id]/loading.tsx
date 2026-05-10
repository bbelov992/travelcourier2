export default function LoadingCourierProfile() {
  return (
    <main className="min-h-screen bg-[#eef3ff] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="h-10 w-32 rounded-2xl bg-white shadow-sm" />
        <div className="mt-6 rounded-[30px] bg-white p-6 shadow-sm sm:p-8">
          <div className="h-5 w-40 rounded-full bg-gray-100" />
          <div className="mt-4 h-10 w-64 rounded-full bg-gray-100" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-2xl bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    </main>
  )
}
