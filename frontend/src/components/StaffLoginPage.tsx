import { Activity, ShieldCheck, UserCheck, Users } from 'lucide-react'
import StaffLoginForm from './StaffLoginForm'

const highlights = [
  {
    icon: Users,
    title: 'Acompanhamento claro',
    description: 'Veja quem precisa de intervenção, quem está ativa e onde existem riscos de abandono.'
  },
  {
    icon: UserCheck,
    title: 'Ativação mais rápida',
    description: 'Concentre o fluxo de criação, entrega de código e registo inicial num único ambiente.'
  },
  {
    icon: Activity,
    title: 'Relatórios acionáveis',
    description: 'Exporte dados com filtros úteis para equipas, parceiros e prestação de contas.'
  }
]

export default function StaffLoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(17,118,183,0.35),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,177,73,0.18),_transparent_24%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-blue-100 backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Portal seguro da equipa WIRA
          </div>

          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Um painel pensado para agir, não apenas observar.
            </h1>
            <p className="text-base leading-7 text-slate-200 md:text-lg">
              Coordene ativações, acompanhe beneficiárias e responda mais depressa a sinais de risco em toda a jornada de capacitação.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <StaffLoginForm />
        </section>
      </div>
    </div>
  )
}
