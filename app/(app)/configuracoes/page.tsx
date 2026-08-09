"use client"

import DescriptionCategoryTable from "../../../components/settings/DescriptionCategoryTable"
import CardsTable from "../../../components/settings/CardsTable"
import PaymentMethodsTable from "../../../components/settings/PaymentMethodsTable"
import SalaryDaysTable from "../../../components/settings/SalaryDaysTable"

export default function Configuracoes() {
  return (
    <div
      className="
        mx-auto w-full min-w-0 max-w-[1400px]
        space-y-6 px-3 py-5
        sm:space-y-8 sm:px-5 sm:py-6
        md:px-6
        lg:space-y-10 lg:px-8 lg:py-8
        xl:px-10 xl:py-10
      "
    >
      <h1 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
        Configurações
      </h1>

      <section className="min-w-0">
        <h2 className="mb-3 text-lg font-semibold text-slate-700 sm:mb-4 sm:text-xl">
          Descrição → Categoria
        </h2>
        <DescriptionCategoryTable />
      </section>

      <section className="min-w-0">
        <h2 className="mb-3 text-lg font-semibold text-slate-700 sm:mb-4 sm:text-xl">
          Cartões
        </h2>
        <CardsTable />
      </section>

      <section className="min-w-0">
        <h2 className="mb-3 text-lg font-semibold text-slate-700 sm:mb-4 sm:text-xl">
          Formas de pagamento
        </h2>
        <PaymentMethodsTable />
      </section>

      <section className="min-w-0">
        <h2 className="mb-3 text-lg font-semibold text-slate-700 sm:mb-4 sm:text-xl">
          Dias de pagamento (salário)
        </h2>
        <SalaryDaysTable />
      </section>
    </div>
  )
}