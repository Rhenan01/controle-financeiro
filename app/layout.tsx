import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/auth/AuthProvider"

export const metadata: Metadata = {
  title: "Controle Financeiro",
  description:
    "Organize suas receitas, despesas e acompanhe sua vida financeira.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
