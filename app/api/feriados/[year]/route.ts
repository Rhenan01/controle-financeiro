import { NextResponse } from "next/server"

const RIO_DE_JANEIRO_IBGE = "3304557"

type FeriadoExterno = {
  data: string
  nome: string
  tipo: string
  bancario?: boolean
}

type RespostaFeriadosApi = {
  cidade?: {
    ibge?: number | string
    nome?: string
    uf?: string
  }
  ano?: number | string
  feriados?: FeriadoExterno[]
  error?: string
  message?: string
}

function converterDataBrasileiraParaISO(data: string) {
  const [dia, mes, ano] = data.split("/")

  if (!dia || !mes || !ano) {
    return ""
  }

  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      year: string
    }>
  }
) {
  const { year } = await context.params

  const anoNumerico = Number(year)

  if (
    !/^\d{4}$/.test(year) ||
    !Number.isInteger(anoNumerico) ||
    anoNumerico < 2000 ||
    anoNumerico > 2100
  ) {
    return NextResponse.json(
      {
        error: "Ano inválido."
      },
      {
        status: 400
      }
    )
  }

  const apiKey = process.env.FERIADOS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "A variável FERIADOS_API_KEY não foi configurada no servidor."
      },
      {
        status: 500
      }
    )
  }

  const url = new URL(
    `https://feriadosapi.com/api/v1/feriados/cidade/${RIO_DE_JANEIRO_IBGE}`
  )

  url.searchParams.set("ano", year)

  // Pontos facultativos não serão tratados como feriados.
  url.searchParams.set("facultativos", "false")

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      },

      /*
        Guarda a resposta por 24 horas.
        Assim, não consultamos a API repetidamente.
      */
      next: {
        revalidate: 60 * 60 * 24
      }
    })

    const payload =
      (await response
        .json()
        .catch(() => null)) as RespostaFeriadosApi | null

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            payload?.message ||
            payload?.error ||
            "A API de feriados recusou a consulta."
        },
        {
          status: response.status
        }
      )
    }

    const feriados = (payload?.feriados ?? [])
      .map((feriado) => ({
        date: converterDataBrasileiraParaISO(
          feriado.data
        ),
        name: feriado.nome,
        type: feriado.tipo,
        banking: Boolean(feriado.bancario)
      }))
      .filter((feriado) => Boolean(feriado.date))

    return NextResponse.json({
      location: {
        ibge: RIO_DE_JANEIRO_IBGE,
        city: payload?.cidade?.nome ?? "Rio de Janeiro",
        state: payload?.cidade?.uf ?? "RJ"
      },
      year: anoNumerico,
      holidays: feriados
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido."

    return NextResponse.json(
      {
        error: `Não foi possível consultar os feriados: ${message}`
      },
      {
        status: 500
      }
    )
  }
}