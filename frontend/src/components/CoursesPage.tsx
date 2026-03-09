import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import MetricCard from '@/components/ui/MetricCard'
import { EmptyCourses } from '@/components/ui/EmptyState'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { BookOpen, Clock, TrendingUp, Plus, Eye, Filter } from 'lucide-react'
import { useCourses } from '@/hooks/useApi'
import { Course } from '@/services/api'

export default function CoursesPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useCourses()
  const courses = data ?? []
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  const metrics = useMemo(() => {
    const totalCourses = courses.length
    const totalHours = courses.reduce((acc, course) => acc + course.duration_hours, 0)
    const avgModules = totalCourses > 0
      ? Math.round(courses.reduce((acc, course) => acc + course.modules_count, 0) / totalCourses)
      : 0

    return {
      totalCourses,
      totalHours,
      avgModules
    }
  }, [courses])

  const levels = useMemo(() => {
    return Array.from(new Set(courses.map(course => course.level))).sort()
  }, [courses])

  const filteredCourses = useMemo(() => {
    if (selectedLevel === 'all') {
      return courses
    }
    return courses.filter(course => course.level === selectedLevel)
  }, [courses, selectedLevel])

  const renderSkills = (course: Course): string[] => {
    return (course.skills ?? '')
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean)
      .slice(0, 4)
  }

  if (loading) {
    return (
      <Layout title="Gestão de Cursos" subtitle="Catálogo oficial de cursos do backend">
        <LoadingOverlay show={loading} message="Carregando cursos..." />
      </Layout>
    )
  }

  return (
    <Layout title="Gestão de Cursos" subtitle="Catálogo oficial de cursos do backend">
      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard title="Cursos" value={metrics.totalCourses} icon={BookOpen} />
        <MetricCard title="Horas Totais" value={metrics.totalHours} icon={Clock} />
        <MetricCard title="Média de Módulos" value={metrics.avgModules} icon={TrendingUp} />
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtro por Nível
          </CardTitle>
          <Button onClick={() => navigate('/courses/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Curso
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant={selectedLevel === 'all' ? 'default' : 'outline'} onClick={() => setSelectedLevel('all')}>
            Todos
          </Button>
          {levels.map(level => (
            <Button
              key={level}
              variant={selectedLevel === level ? 'default' : 'outline'}
              onClick={() => setSelectedLevel(level)}
            >
              {level}
            </Button>
          ))}
        </CardContent>
      </Card>

      {filteredCourses.length === 0 ? (
        <EmptyCourses onAdd={() => navigate('/courses/create')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge>{course.level}</Badge>
                  <Badge variant="outline">{course.modules_count} módulos</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{course.description ?? 'Sem descrição detalhada.'}</p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration_hours}h</span>
                  </div>
                  <div>
                    <span className="font-medium">Instrutor:</span> {course.instructor ?? 'Equipa WIRA'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {renderSkills(course).map(skill => (
                    <Badge key={`${course.id}-${skill}`} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <Button variant="outline" className="w-full" onClick={() => navigate(`/courses/${course.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  )
}
