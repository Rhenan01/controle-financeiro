"use client"

import DescriptionCategoryTable from "../../../components/settings/DescriptionCategoryTable"
import CardsTable from "../../../components/settings/CardsTable"
import PaymentMethodsTable from "../../../components/settings/PaymentMethodsTable"
import SalaryDaysTable from "../../../components/settings/SalaryDaysTable"

export default function Configuracoes() {

  return (

    <div className="p-10 max-w-[1400px] mx-auto space-y-10">

      <h1 className="text-3xl font-semibold text-slate-800">
        Configurações
      </h1>


      {/* descrição → categoria */}

      <section>

        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Descrição → Categoria
        </h2>

        <DescriptionCategoryTable />

      </section>


      {/* cartões */}

      <section>

        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Cartões
        </h2>

        <CardsTable />

      </section>


      {/* formas de pagamento */}

      <section>

        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Formas de pagamento
        </h2>

        <PaymentMethodsTable />

      </section>


      {/* dias de pagamento */}

      <section>

        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Dias de pagamento (salário)
        </h2>

        <SalaryDaysTable />

      </section>

    </div>

  )

}