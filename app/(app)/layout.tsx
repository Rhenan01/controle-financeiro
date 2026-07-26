import Sidebar from "@/components/Sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 to-slate-200 lg:flex lg:h-screen">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
        {children}
      </main>
    </div>
  )
}