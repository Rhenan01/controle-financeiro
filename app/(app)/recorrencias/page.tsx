"use client"

import {
  CalendarClock,
  FilePlus2,
  Repeat2
} from "lucide-react"

export default function RecorrenciasPage() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-[1400px] space-y-6 p-3 sm:p-5 lg:p-6 xl:p-8">
      <header className="space-y-2">
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FilePlus2 size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-800">
                Modelos recorrentes
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Cadastre salário, aluguel, internet, assinaturas, reservas e
                outros lançamentos que se repetem.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              Nenhum modelo recorrente cadastrado.
            </p>

            <button
              type="button"
              disabled
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white opacity-50"
            >
              + Novo modelo
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarClock size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-800">
                Gerar período financeiro
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Visualize os modelos aplicáveis ao período antes de inserir os
                lançamentos.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              A geração será habilitada depois que os modelos forem
              implementados.
            </p>

            <button
              type="button"
              disabled
              className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white opacity-50"
            >
              Visualizar lançamentos
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <h2 className="font-medium text-blue-800">
          Regras de data disponíveis
        </h2>

        <div className="mt-3 grid gap-2 text-sm text-blue-700 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg bg-white/70 px-3 py-2">
            Dia fixo do mês
          </div>

          <div className="rounded-lg bg-white/70 px-3 py-2">
            No dia do salário
          </div>

          <div className="rounded-lg bg-white/70 px-3 py-2">
            X dias depois do salário
          </div>

          <div className="rounded-lg bg-white/70 px-3 py-2">
            N-ésimo dia útil do período
          </div>

          <div className="rounded-lg bg-white/70 px-3 py-2">
            Último dia do período financeiro
          </div>
        </div>
      </section>
    </main>
  )
}