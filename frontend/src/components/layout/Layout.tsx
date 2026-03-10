import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Breadcrumbs from './Breadcrumbs'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children?: React.ReactNode
  className?: string
  showBreadcrumbs?: boolean
  title?: string
  subtitle?: string
}

export default function Layout({
  children,
  className,
  showBreadcrumbs = true,
  title,
  subtitle
}: LayoutProps) {
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-transparent text-foreground">
      <Sidebar
        mobileOpen={sidebarMobileOpen}
        onMobileOpenChange={setSidebarMobileOpen}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header onMenuClick={() => setSidebarMobileOpen(prev => !prev)} />

        <main className={cn('flex-1 px-4 pb-8 pt-6 md:px-6 lg:px-8', className)}>
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                {showBreadcrumbs ? <Breadcrumbs /> : null}
                {title ? (
                  <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
                    {subtitle ? (
                      <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{subtitle}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
