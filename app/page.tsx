import Link from "next/link"

export default function Home() {
  return (
    <main className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Controle Financeiro
      </h1>

      <Link href="/dashboard">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg">
          Entrar no Dashboard
        </button>
      </Link>

    </main>
  )
}