import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAcoes } from '@/hooks/useAcoes'
import { isUrgente } from '@/utils/urgencia'
import { Badge } from '@/components/brand'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/barema', label: 'Barema' },
  { to: '/acoes', label: 'Ações' },
  { to: '/areas', label: 'Áreas' },
  { to: '/historico', label: 'Histórico' },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const { acoes } = useAcoes()

  const urgentes = acoes.filter((a) => a.status !== 'concluido' && isUrgente(a.prazo)).length

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-teal-dark text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-mustard">AM Mentoria</div>
            <div className="font-display text-lg font-medium">Barema Tracker</div>
          </div>

          <nav className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 font-sans text-sm font-medium transition-colors',
                    isActive ? 'bg-coral text-paper' : 'text-paper/80 hover:bg-paper/10 hover:text-paper',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {urgentes > 0 ? (
              <NavLink to="/acoes">
                <Badge tone="coral">{urgentes} ação(ões) urgente(s)</Badge>
              </NavLink>
            ) : null}
            <button
              type="button"
              onClick={() => signOut()}
              className="font-mono text-xs text-paper/70 underline hover:text-paper"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
