"use client"

import { Repeat2 } from "lucide-react"

import RecurringTransactionsManager from "@/components/recurring/RecurringTransactionsManager"
import RecurringPeriodGenerator from "@/components/recurring/RecurringPeriodGenerator"

export default function RecorrenciasPage() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-[1400px] space-y-6 p-3 pb-24 sm:p-5 sm:pb-24 lg:p-6 lg:pb-6 xl:p-8">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Repeat2 size={22} />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-800 sm:text-3xl">
              Lançamentos recorrentes
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Cadastre modelos e gere os lançamentos de cada período financeiro.
            </p>
          </div>
        </div>
      </header>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <RecurringTransactionsManager />

        <RecurringPeriodGenerator />
      </section>
    </main>
  )
}