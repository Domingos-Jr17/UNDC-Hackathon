import React, { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  Filter,
  MoreHorizontal,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: keyof T
  title: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  render?: (value: any, row: T, index: number) => React.ReactNode
  filterOptions?: { value: string; label: string }[]
}

export type SortDirection = 'asc' | 'desc' | null

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  pagination?: boolean
  pageSize?: number
  onRowClick?: (row: T, index: number) => void
  emptyMessage?: string
  className?: string
  actions?: {
    label: string
    onClick: (row: T) => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value).trim().toLowerCase()
}

const compareValues = (aVal: unknown, bVal: unknown): number => {
  if (aVal === null || aVal === undefined) return 1
  if (bVal === null || bVal === undefined) return -1

  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return aVal - bVal
  }

  const aDate = new Date(String(aVal))
  const bDate = new Date(String(bVal))
  const aIsDate = !Number.isNaN(aDate.getTime())
  const bIsDate = !Number.isNaN(bDate.getTime())

  if (aIsDate && bIsDate) {
    return aDate.getTime() - bDate.getTime()
  }

  const aNumber = Number(aVal)
  const bNumber = Number(bVal)
  const aIsNumber = !Number.isNaN(aNumber)
  const bIsNumber = !Number.isNaN(bNumber)

  if (aIsNumber && bIsNumber) {
    return aNumber - bNumber
  }

  return String(aVal).localeCompare(String(bVal), 'pt')
}

function DataTableComponent<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  pagination = true,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'Nenhum registo encontrado',
  className,
  actions
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    if (searchTerm) {
      const normalizedSearch = normalizeValue(searchTerm)
      result = result.filter(item =>
        columns.some(column => normalizeValue(item[column.key]).includes(normalizedSearch))
      )
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return
      result = result.filter(item => {
        const rawValue = item[key]
        return normalizeValue(rawValue) === normalizeValue(value) || normalizeValue(rawValue).includes(normalizeValue(value))
      })
    })

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const comparison = compareValues(a[sortColumn], b[sortColumn])
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [columns, data, filters, searchTerm, sortColumn, sortDirection])

  const paginatedData = useMemo(() => {
    if (!pagination) return filteredAndSortedData

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [currentPage, filteredAndSortedData, pageSize, pagination])

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)

  const handleSort = (column: keyof T) => {
    setCurrentPage(1)
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
      return
    }

    setSortColumn(column)
    setSortDirection('asc')
  }

  const handleFilter = (column: keyof T, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }))
    setCurrentPage(1)
  }

  const getSortIcon = (column: keyof T) => {
    if (sortColumn !== column) return <ChevronsUpDownIcon className="h-4 w-4" />
    if (sortDirection === 'asc') return <ChevronUpIcon className="h-4 w-4" />
    if (sortDirection === 'desc') return <ChevronDownIcon className="h-4 w-4" />
    return <ChevronsUpDownIcon className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="overflow-hidden rounded-3xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={String(column.key)} style={{ width: column.width }}>
                    <div className="h-4 animate-pulse rounded bg-muted" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {(searchable || columns.some(col => col.filterable)) ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {searchable ? (
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setCurrentPage(1)
                }}
                className="h-11 rounded-2xl border-white bg-white pl-10 shadow-sm"
              />
            </div>
          ) : null}

          {columns.some(col => col.filterable) ? (
            <div className="flex flex-wrap gap-2">
              {columns.filter(col => col.filterable).map((column) => (
                <DropdownMenu key={String(column.key)}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-full bg-white">
                      <Filter className="h-4 w-4" />
                      {column.title}
                      {filters[String(column.key)] ? (
                        <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary">
                          Ativo
                        </Badge>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleFilter(column.key, '')}>Todos</DropdownMenuItem>
                    {column.filterOptions?.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleFilter(column.key, option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={String(column.key)} style={{ width: column.width }}>
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold text-slate-700"
                        onClick={() => handleSort(column.key)}
                      >
                        {column.title}
                        {getSortIcon(column.key)}
                      </Button>
                    ) : (
                      <span className="font-semibold text-slate-700">{column.title}</span>
                    )}
                  </TableHead>
                ))}
                {actions ? <TableHead className="w-[80px]">Ações</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={cn(onRowClick ? 'cursor-pointer hover:bg-slate-50' : undefined)}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                      </TableCell>
                    ))}
                    {actions ? (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <span className="sr-only">Abrir menu de ações</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  action.onClick(row)
                                }}
                                className={cn(
                                  'cursor-pointer',
                                  action.variant === 'destructive' ? 'text-destructive' : undefined
                                )}
                              >
                                {action.icon ? <action.icon className="mr-2 h-4 w-4" /> : null}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && totalPages > 1 ? (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, filteredAndSortedData.length)} de {filteredAndSortedData.length} registos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent

export default DataTable
