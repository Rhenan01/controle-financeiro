import Sidebar from "@/components/Sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <div className="flex h-screen">

      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-200 p-8">

        {children}

      </main>

    </div>

  )

}