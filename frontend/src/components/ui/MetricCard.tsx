import { LucideIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period: string
  }
  className?: string
  loading?: boolean
  tone?: 'primary' | 'success' | 'warning' | 'neutral'
}

const toneStyles = {
  primary: {
    card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white',
    icon: 'bg-sky-100 text-sky-700'
  },
  success: {
    card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
    icon: 'bg-emerald-100 text-emerald-700'
  },
  warning: {
    card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white',
    icon: 'bg-amber-100 text-amber-700'
  },
  neutral: {
    card: 'border-slate-200/80 bg-white',
    icon: 'bg-slate-100 text-slate-700'
  }
}

export default function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  loading = false,
  tone = 'neutral'
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend?.type) {
      case 'increase':
        return <TrendingUp className="h-3 w-3" />
      case 'decrease':
        return <TrendingDown className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  const getTrendBgColor = () => {
    switch (trend?.type) {
      case 'increase':
        return 'bg-emerald-100 text-emerald-800'
      case 'decrease':
        return 'bg-rose-100 text-rose-800'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <Card className={cn('overflow-hidden rounded-3xl border', className)}>
        <CardContent className="p-5">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const styles = toneStyles[tone]

  return (
    <Card className={cn('overflow-hidden rounded-3xl border shadow-sm', styles.card, className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {(description || trend) ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {description ? <span>{description}</span> : null}
            {trend ? (
              <Badge variant="secondary" className={getTrendBgColor()}>
                {getTrendIcon()}
                <span className="ml-1">{Math.abs(trend.value)}% {trend.period}</span>
              </Badge>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
