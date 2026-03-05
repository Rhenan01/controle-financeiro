"use client"

export default function CategoriesTable() {

  const categories = [

    {
      nome: "Alimentação",
      tipo: "SAÍDA"
    },
    {
      nome: "Moradia",
      tipo: "SAÍDA"
    },
    {
      nome: "Transporte",
      tipo: "SAÍDA"
    },
    {
      nome: "Investimentos",
      tipo: "SAÍDA"
    },
    {
      nome: "Salário",
      tipo: "ENTRADA"
    },
    {
      nome: "Reembolso",
      tipo: "ENTRADA"
    }

  ]


  return (

    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-gray-50 text-gray-600">

          <tr>

            <th className="text-left px-6 py-3">
              Categoria
            </th>

            <th className="text-left px-6 py-3">
              Tipo
            </th>

            <th className="text-right px-6 py-3">
              Ações
            </th>

          </tr>

        </thead>


        <tbody>

          {categories.map((cat, index) => (

            <tr
              key={index}
              className="border-t border-gray-100 hover:bg-gray-50"
            >

              <td className="px-6 py-3 text-slate-700 font-medium">
                {cat.nome}
              </td>

              <td className="px-6 py-3">

                {cat.tipo === "ENTRADA" ? (

                  <span className="text-green-600 font-semibold">
                    ENTRADA
                  </span>

                ) : (

                  <span className="text-red-500 font-semibold">
                    SAÍDA
                  </span>

                )}

              </td>

              <td className="px-6 py-3 text-right">

                <button className="text-blue-600 hover:underline text-sm">
                  editar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}