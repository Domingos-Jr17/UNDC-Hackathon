import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../types/navigation'
import apiService, { QuizQuestion } from '../services/api'
import sessionService from '../services/session'

type QuizScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Quiz'>
type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>

interface QuizScreenProps {
  route: QuizScreenRouteProp
  navigation: QuizScreenNavigationProp
}

const PASSING_SCORE = 70

const normalizeAnswerIndex = (question: QuizQuestion): number => {
  const optionsLength = question.options.length
  if (question.correctAnswer >= 0 && question.correctAnswer < optionsLength) {
    return question.correctAnswer
  }
  if (question.correctAnswer >= 1 && question.correctAnswer <= optionsLength) {
    return question.correctAnswer - 1
  }
  return 0
}

export default function QuizScreen({ route, navigation }: QuizScreenProps) {
  const { courseId, moduleId } = route.params
  const [userCode, setUserCode] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
    } catch (error) {
      Alert.alert('Erro', (error as Error).message)
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
    const [aggregated] = await Promise.all([
      apiService.getAggregatedProgress(userCode)
    ])

    const progressItem = aggregated.courses.find(item => item.courseId === courseId)
    const completed = new Set(progressItem?.completedModules ?? [])
    completed.add(String(moduleId))

    const modulesCount = progressItem?.modulesCount ?? completed.size
    const percentage = Math.min(100, Math.round((completed.size / modulesCount) * 100))

    await apiService.updateProgress(userCode, courseId, [...completed], percentage)

    if (score >= PASSING_SCORE) {
      await apiService.generateCertificate(userCode, courseId, score)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) {
      Alert.alert('Quiz incompleto', 'Responda todas as perguntas antes de finalizar.')
      return
    }

    const correct = questions.reduce((acc, question, index) => {
      const expected = normalizeAnswerIndex(question)
      return answers[index] === expected ? acc + 1 : acc
    }, 0)

    const score = Math.round((correct / questions.length) * 100)

    try {
      setSubmitting(true)
      await persistProgress(score)

      if (score >= PASSING_SCORE) {
        Alert.alert(
          'Aprovada',
          `Voce acertou ${correct} de ${questions.length} (${score}%). Certificado gerado.`,
          [
            {
              text: 'Ver Certificado',
              onPress: () => navigation.navigate('Certificate', { courseId, score })
            },
            {
              text: 'Voltar',
              onPress: () => navigation.goBack()
            }
          ]
        )
      } else {
        Alert.alert(
          'Continue estudando',
          `Voce acertou ${correct} de ${questions.length} (${score}%). A nota minima e ${PASSING_SCORE}%.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        )
      }
    } catch (error) {
      Alert.alert('Erro ao finalizar quiz', (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Quiz • Modulo {moduleId}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.progressText}>
          Pergunta {currentQuestion + 1} de {questions.length}
        </Text>
        <View style={styles.questionCard}>
          <Text style={styles.question}>{question.question}</Text>
        </View>

        <View style={styles.options}>
          {question.options.map((option, index) => {
            const selected = answers[currentQuestion] === index
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => setAnswer(currentQuestion, index)}
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
              style={[styles.primaryButton, (submitting || !canSubmit) && styles.disabledButton]}
              onPress={() => {
                void handleSubmit()
              }}
              disabled={submitting || !canSubmit}
            >
              <Text style={styles.primaryButtonText}>{submitting ? 'Enviando...' : 'Finalizar Quiz'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '600'
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18
  },
  backButton: {
    color: '#90CAF9',
    marginBottom: 8,
    fontSize: 15
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700'
  },
  content: {
    padding: 20
  },
  progressText: {
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 12
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16
  },
  question: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600'
  },
  options: {
    marginTop: 14,
    gap: 8
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  optionButtonSelected: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF'
  },
  optionText: {
    color: '#1F2937',
    fontSize: 14
  },
  optionTextSelected: {
    color: '#1E3A8A',
    fontWeight: '700'
  },
  navigation: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 8
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.6
  }
})
