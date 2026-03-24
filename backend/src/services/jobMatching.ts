import prismaService from './prisma'

const prisma = prismaService.getClient()

export interface CandidateProfile {
  anonymousCode: string
  ngoId: string | null
  location: string | null
  skills: string[]
  certificateCount: number
  completedCoursesCount: number
}

export const parseSkills = (value?: string | null): string[] =>
  (value ?? '')
    .split(',')
    .map(skill => skill.trim().toLowerCase())
    .filter(Boolean)

export const getUniqueSkills = (skills: string[]): string[] => [...new Set(skills)]

export const deriveCandidateProfile = async (anonymousCode: string): Promise<CandidateProfile | null> => {
  const user = await prisma.user.findUnique({
    where: { anonymous_code: anonymousCode },
    include: {
      progresses: {
        include: {
          course: {
            select: { skills: true }
          }
        }
      },
      certificates: {
        where: { revoked: false },
        select: { id: true }
      }
    }
  })

  if (!user) {
    return null
  }

  const declaredSkills = parseSkills(user.initial_skills)
  const courseSkills = user.progresses.flatMap(progress => parseSkills(progress.course?.skills))

  return {
    anonymousCode: user.anonymous_code,
    ngoId: user.ngo_id,
    location: user.location ?? null,
    skills: getUniqueSkills([...declaredSkills, ...courseSkills]),
    certificateCount: user.certificates.length,
    completedCoursesCount: user.progresses.filter(progress => progress.percentage >= 100).length
  }
}

export const calculateMatchScore = (
  profile: CandidateProfile,
  job: {
    required_skills: string
    location: string
  }
): {
  score: number
  sharedSkills: string[]
  rationale: string[]
} => {
  const requiredSkills = parseSkills(job.required_skills)
  const sharedSkills = requiredSkills.filter(skill => profile.skills.includes(skill))
  const rationale: string[] = []

  const skillScore = requiredSkills.length > 0
    ? Math.round((sharedSkills.length / requiredSkills.length) * 60)
    : 0
  if (sharedSkills.length > 0) {
    rationale.push(`Skills alinhadas: ${sharedSkills.join(', ')}`)
  }

  const locationScore = profile.location && profile.location.toLowerCase() === job.location.toLowerCase() ? 20 : 0
  if (locationScore > 0) {
    rationale.push(`Localização alinhada com ${job.location}`)
  }

  const certificateScore = profile.certificateCount > 0 ? Math.min(10, profile.certificateCount * 5) : 0
  if (certificateScore > 0) {
    rationale.push(`Certificações concluídas: ${profile.certificateCount}`)
  }

  const completionScore = profile.completedCoursesCount > 0 ? Math.min(10, profile.completedCoursesCount * 5) : 0
  if (completionScore > 0) {
    rationale.push(`Cursos concluídos: ${profile.completedCoursesCount}`)
  }

  return {
    score: Math.min(100, skillScore + locationScore + certificateScore + completionScore),
    sharedSkills,
    rationale
  }
}
