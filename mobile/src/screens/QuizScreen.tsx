import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import AppShell from '../components/AppShell'
import { RootStackParamList } from '../types/navigation'
import apiService, { QuizQuestion, QuizSubmissionResult } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

type QuizScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Quiz'>
type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>

interface QuizScreenProps {
  route: QuizScreenRouteProp
  navigation: QuizScreenNavigationProp
}

interface QuizResult {
  score: number
  correct: number
  passed: boolean
  reviews?: QuizSubmissionResult['reviews']
}

const PASSING_SCORE = 70

export default function QuizScreen({ route, navigation }: QuizScreenProps) {
  const { courseId, moduleId } = route.params
  const [userCode, setUserCode] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)

  const loadQuiz = useCallback(async (): Promise<void> => {
    try {
      const storedUserCode = await sessionService.getUserCode()
      if (!storedUserCode) {
        navigation.navigate('Login')
        return
      }

      const quiz = await apiService.getCourseQuiz(courseId)
      setUserCode(storedUserCode)
      setQuestions(quiz)
      setAnswers(Array(quiz.length).fill(-1))
      setResult(null)
      setHasSubmitted(false)
      setSubmitting(false)
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    } finally {
      setLoading(false)
    }
  }, [courseId, navigation])

  useEffect(() => {
    void loadQuiz()
  }, [loadQuiz])

  const canSubmit = useMemo(() => answers.every(item => item >= 0) && answers.length > 0, [answers])

  const setAnswer = (questionIndex: number, optionIndex: number): void => {
    setAnswers(prev => {
      const next = [...prev]
      next[questionIndex] = optionIndex
      return next
    })
  }

  const persistProgress = async (score: number): Promise<void> => {
    const [aggregated, courseProgress] = await Promise.all([
      apiService.getAggregatedProgress(userCode),
      apiService.getCourseProgress(userCode, courseId).catch(() => null)
    ])

    const progressItem = aggregated.courses.find(item => item.courseId === courseId)
    const completed = new Set(progressItem?.completedModules ?? [])
    completed.add(String(moduleId))

    const modulesCount = progressItem?.modulesCount ?? completed.size
    const percentage = Math.min(100, Math.round((completed.size / modulesCount) * 100))
    const quizAttempts = (courseProgress?.quiz_attempts ?? 0) + 1

    await apiService.updateProgress(userCode, courseId, [...completed], percentage, {
      quizAttempts,
      lastQuizScore: score
    })

    if (score >= PASSING_SCORE) {
      await apiService.generateCertificate(userCode, courseId, score)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (submitting || hasSubmitted) {
      return
    }

    if (!canSubmit) {
      showAlert('Quiz incompleto', 'Responda todas as perguntas antes de finalizar.')
      return
    }

    try {
      setSubmitting(true)
      const submission = await apiService.submitQuiz(userCode, courseId, answers)
      await persistProgress(submission.score)
      setHasSubmitted(true)
      setResult({
        score: submission.score,
        correct: submission.correctAnswers,
        passed: submission.passed,
        reviews: submission.reviews
      })
    } catch (error) {
      setHasSubmitted(false)
      showAlert('Erro ao finalizar quiz', (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const answeredCount = useMemo(() => answers.filter(item => item >= 0).length, [answers])

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (questions.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Quiz indisponivel para este curso.</Text>
      </View>
    )
  }

  const question = questions[currentQuestion]

  if (!question) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Pergunta indisponivel. Tente recarregar o quiz.</Text>
      </View>
    )
  }

  return (
    <AppShell
      navigation={navigation}
      activeRoute="CourseLibrary"
      title={`Quiz do modulo ${moduleId}`}
      subtitle="Responda com calma. Ao atingir a nota minima, o certificado fica disponivel automaticamente."
      showLogout={false}
    >
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
        <Text style={styles.backButton}>Voltar para o modulo</Text>
      </TouchableOpacity>

      <View style={styles.progressSummaryCard}>
        <Text style={styles.progressText}>
          Pergunta {currentQuestion + 1} de {questions.length}
        </Text>
        <Text style={styles.progressMeta}>{answeredCount} resposta(s) marcada(s)</Text>
      </View>

      <View style={styles.contentCard}>
        <View style={styles.questionCard}>
          <Text style={styles.question}>{question.question}</Text>
        </View>

        <View style={styles.options}>
          {question.options.map((option, index) => {
            const selected = answers[currentQuestion] === index
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, selected && styles.optionButtonSelected, hasSubmitted && styles.disabledButton]}
                onPress={() => setAnswer(currentQuestion, index)}
                disabled={hasSubmitted}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.secondaryButton, currentQuestion === 0 && styles.disabledButton]}
            onPress={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            <Text style={styles.secondaryButtonText}>Anterior</Text>
          </TouchableOpacity>

          {currentQuestion < questions.length - 1 ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
            >
              <Text style={styles.primaryButtonText}>Proxima</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, (submitting || !canSubmit || hasSubmitted) && styles.disabledButton]}
              onPress={() => {
                void handleSubmit()
              }}
              disabled={submitting || !canSubmit || hasSubmitted}
            >
              <Text style={styles.primaryButtonText}>{submitting ? 'Enviando...' : 'Finalizar Quiz'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            {result.passed ? 'Quiz concluido' : 'Continue a estudar'}
          </Text>
          <Text style={styles.resultSubtitle}>
            Voce acertou {result.correct} de {questions.length} ({result.score}%).
          </Text>
          <Text style={styles.resultSubtitle}>
            Nota minima: {PASSING_SCORE}%.
          </Text>

          {questions.map((item, index) => {
            const review = result.reviews?.[index]
            const expected = review?.correctIndex ?? 0
            const selected = review?.selectedIndex ?? answers[index] ?? -1
            const isCorrect = review?.isCorrect ?? false
            const selectedOption = selected >= 0 && selected < item.options.length ? item.options[selected] : undefined
            const expectedOption = item.options[expected] ?? ''
            return (
              <View key={`${item.id}-${index}`} style={styles.explanationCard}>
                <Text style={styles.explanationQuestion}>
                  {index + 1}. {item.question}
                </Text>
                <Text style={[styles.explanationMeta, isCorrect ? styles.correctText : styles.incorrectText]}>
                  Sua resposta: {selectedOption ? `${String.fromCharCode(65 + selected)}. ${selectedOption}` : 'Nao respondida'}
                </Text>
                <Text style={styles.explanationMeta}>
                  Correta: {String.fromCharCode(65 + expected)}. {expectedOption}
                </Text>
                {(review?.explanation || item.explanation) ? (
                  <Text style={styles.explanationText}>Explicacao: {review?.explanation ?? item.explanation}</Text>
                ) : null}
              </View>
            )
          })}

          <View style={styles.resultActions}>
            {result.passed ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Certificate', { courseId, score: result.score })}
              >
                <Text style={styles.primaryButtonText}>Ver certificado</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryButtonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </AppShell>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600'
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  backButton: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700'
  },
  progressSummaryCard: {
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    padding: 16,
    ...shadows.card
  },
  progressText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15
  },
  progressMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4
  },
  contentCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  questionCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    padding: 16
  },
  question: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700'
  },
  options: {
    marginTop: 14,
    gap: 8
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  optionText: {
    color: colors.text,
    fontSize: 14
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '700'
  },
  navigation: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 8
  },
  resultCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary
  },
  resultSubtitle: {
    fontSize: 13,
    color: colors.textMuted
  },
  explanationCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 12,
    marginTop: 8,
    backgroundColor: colors.surfaceMuted
  },
  explanationQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6
  },
  explanationMeta: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 4
  },
  explanationText: {
    fontSize: 12,
    color: colors.textMuted
  },
  correctText: {
    color: colors.success
  },
  incorrectText: {
    color: colors.danger
  },
  resultActions: {
    marginTop: 12,
    gap: 10
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '700'
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.6
  }
})
