import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type QuizScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;

interface QuizScreenProps {
    route: QuizScreenRouteProp;
    navigation: QuizScreenNavigationProp;
}

interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface QuizData {
    costura: {
        questions: Question[];
    };
    culinaria: {
        questions: Question[];
    };
    agricultura: {
        questions: Question[];
    };
}

export default function QuizScreen({ route, navigation }: QuizScreenProps) {
    const { courseId, moduleId } = route.params;
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [showResults, setShowResults] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);

    const quizData: QuizData = {
        costura: {
            questions: [
                {
                    id: 1,
                    question: 'Qual é o primeiro passo ao costurar um bolso?',
                    options: [
                        'Cortar o tecido',
                        'Preparar o acabamento das bordas',
                        'Costurar diretamente na peça',
                        'Medir e marcar a posição'
                    ],
                    correctAnswer: 3,
                    explanation: 'Antes de costurar, é essencial medir e marcar a posição exata do bolso na peça para garantir alinhamento.'
                },
                {
                    id: 2,
                    question: 'Qual máquina industrial é mais adequada para produção de uniformes escolares?',
                    options: [
                        'Máquina reta',
                        'Máquina overlock',
                        'Máquina zig-zag',
                        'Máquina industrial plana'
                    ],
                    correctAnswer: 3,
                    explanation: 'Máquinas industriais planas são ideais para produção em massa de uniformes, pois oferecem maior velocidade e consistência.'
                },
                {
                    id: 3,
                    question: 'Qual é a função da agulha dupla em uma máquina industrial?',
                    options: [
                        'Criar pontos decorativos',
                        'Fazer costura reforçada',
                        'Costurar duas camadas de tecido simultaneamente',
                        'Permitir costura mais rápida em tecidos espessos'
                    ],
                    correctAnswer: 3,
                    explanation: 'A agulha dupla permite costurar duas camadas simultaneamente, aumentando a produtividade em tecidos espessos.'
                },
                {
                    id: 4,
                    question: 'Como deve ser a tensão da linha na máquina industrial?',
                    options: [
                        'A mais alta possível',
                        'A mais baixa possível',
                        'A recomendada pelo fabricante',
                        'Ajustada conforme o tecido'
                    ],
                    correctAnswer: 3,
                    explanation: 'A tensão deve ser ajustada conforme o tipo de tecido. Tecidos finos exigem tensão menor, enquanto tecidos espessos exigem tensão maior.'
                },
                {
                    id: 5,
                    question: 'Qual é a finalidade do ponto de arremate?',
                    options: [
                        'Decorar a peça',
                        'Fortalecer a costura',
                        'Evitar desfiamento',
                        'Todas as anteriores'
                    ],
                    correctAnswer: 4,
                    explanation: 'O ponto de arremate tem múltiplas finalidades: decorar, fortalecer e evitar desfiamento.'
                }
            ]
        },
        culinaria: {
            questions: [
                {
                    id: 1,
                    question: 'Qual é a temperatura interna segura para cozinhar frango?',
                    options: [
                        '60°C',
                        '74°C',
                        '80°C',
                        '85°C'
                    ],
                    correctAnswer: 1,
                    explanation: 'A temperatura interna de 74°C é necessária para garantir que o frango esteja completamente cozido e seguro para consumo.'
                },
                {
                    id: 2,
                    question: 'Qual técnica de corte é usada para criar cubos uniformes de vegetais?',
                    options: [
                        'Julienne',
                        'Brunoise',
                        'Macedoine',
                        'Chiffonade'
                    ],
                    correctAnswer: 2,
                    explanation: 'Brunoise é a técnica de cortar vegetais em cubos pequenos e uniformes (cerca de 3mm), ideal para molhos e guarnições.'
                },
                {
                    id: 3,
                    question: 'O que significa "mise en place" na cozinha profissional?',
                    options: [
                        'Técnica de emulsificação',
                        'Método de cozimento lento',
                        'Organização prévia dos ingredientes',
                        'Tipo de corte de legumes'
                    ],
                    correctAnswer: 2,
                    explanation: '"Mise en place" é o termo francês para organizar todos os ingredientes e equipamentos antes de começar a cozinhar.'
                },
                {
                    id: 4,
                    question: 'Qual é a principal diferença entre caldo e sopa?',
                    options: [
                        'Temperatura de serving',
                        'Presença de ingredientes sólidos',
                        'Tempo de cozimento',
                        'Tipo de tempero'
                    ],
                    correctAnswer: 1,
                    explanation: 'Caldo é principalmente líquido, enquanto sopa contém ingredientes sólidos significativos.'
                },
                {
                    id: 5,
                    question: 'Como se deve armazenar properly facas de cozinha?',
                    options: [
                        'Lavar na máquina de lavar loiça',
                        'Guardar na gaveta com outros talheres',
                        'Higienizar à mão e guardar em bloco ou suporte',
                        'Deixar de molho em solução desinfetante'
                    ],
                    correctAnswer: 2,
                    explanation: 'Facas devem ser lavadas à mão, secas imediatamente e guardadas em bloco ou suporte para manter o fio e prevenir acidentes.'
                }
            ]
        },
        agricultura: {
            questions: [
                {
                    id: 1,
                    question: 'Qual é o pH ideal para a maioria das culturas vegetais?',
                    options: [
                        '4.0 - 5.5',
                        '6.0 - 7.0',
                        '7.5 - 8.5',
                        '8.0 - 9.0'
                    ],
                    correctAnswer: 1,
                    explanation: 'A maioria das culturas vegetais se desenvolve melhor em solo com pH entre 6.0 e 7.0, que permite boa disponibilidade de nutrientes.'
                },
                {
                    id: 2,
                    question: 'O que é rotação de culturas na agricultura sustentável?',
                    options: [
                        'Irrigação por rotação',
                        'Alternar diferentes culturas na mesma área',
                        'Plantar em círculos',
                        'Rodar as plantas durante o crescimento'
                    ],
                    correctAnswer: 1,
                    explanation: 'Rotação de culturas é a prática de alternar diferentes culturas na mesma área ao longo do tempo para melhorar a saúde do solo.'
                },
                {
                    id: 3,
                    question: 'Qual método de irrigação é mais eficiente em termos de conservação de água?',
                    options: [
                        'Irrigação por inundação',
                        'Aspersão convencional',
                        'Gotejamento',
                        'Sulcos'
                    ],
                    correctAnswer: 2,
                    explanation: 'Irrigação por gotejamento é a mais eficiente, entregando água diretamente às raízes e minimizando evaporação.'
                },
                {
                    id: 4,
                    question: 'O que são "leguminosas fixadoras de nitrogênio"?',
                    options: [
                        'Plantas que produzem excesso de nitrogênio',
                        'Plantas que convertem nitrogênio atmosférico em forma utilizável',
                        'Fertilizantes sintéticos',
                        'Plantas que exigem muito nitrogênio'
                    ],
                    correctAnswer: 1,
                    explanation: 'Leguminosas como feijão e ervilha têm bactérias em suas raízes que convertem nitrogênio atmosférico em formas que as plantas podem usar.'
                },
                {
                    id: 5,
                    question: 'Qual é a principal vantagem da agricultura orgânica?',
                    options: [
                        'Menor custo inicial',
                        'Maior produtividade por área',
                        'Melhor saúde do solo e menor impacto ambiental',
                        'Menor necessidade de mão de obra'
                    ],
                    correctAnswer: 2,
                    explanation: 'Agricultura orgânica prioriza saúde do solo, biodiversidade e reduz impacto ambiental, evitando sintéticos e promovendo ecossistemas sustentáveis.'
                }
            ]
        }
    };

    const courseQuiz = quizData[courseId as keyof QuizData] || quizData.costura;
    const questions = courseQuiz.questions;

    const handleAnswerSelect = (questionId: number, answerIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[questionId] = answerIndex;
        setSelectedAnswers(newAnswers);
    };

    const handleSubmit = () => {
        let correctAnswers = 0;

        questions.forEach((question: Question, index: number) => {
            if (selectedAnswers[index] === question.correctAnswer) {
                correctAnswers++;
            }
        });

        const finalScore = Math.round((correctAnswers / questions.length) * 100);
        setScore(finalScore);
        setShowResults(true);

        if (finalScore >= 70) {
            Alert.alert(
                'Parabéns!',
                `Você acertou ${correctAnswers} de ${questions.length} perguntas (${finalScore}%). Módulo concluído com sucesso!`,
                [
                    {
                        text: 'Ver Certificado',
                        onPress: () => {
                            navigation.navigate('Certificate', {
                                courseId: courseId,
                                score: finalScore
                            });
                        }
                    },
                    {
                        text: 'Voltar ao Curso',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } else {
            Alert.alert(
                'Continue Estudando',
                `Você acertou ${correctAnswers} de ${questions.length} perguntas (${finalScore}%). Estude mais e tente novamente.`,
                [
                    { text: 'Tentar Novamente', onPress: handleRetry },
                    { text: 'Voltar ao Curso', onPress: () => navigation.goBack() }
                ]
            );
        }
    };

    const handleRetry = () => {
        setCurrentQuestion(0);
        setSelectedAnswers([]);
        setShowResults(false);
        setScore(0);
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack}>
                    <Text style={styles.backButton}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Quiz - Módulo {moduleId}</Text>
            </View>

            {!showResults ? (
                <View>
                    <View style={styles.questionContainer}>
                        <View style={styles.questionHeader}>
                            <Text style={styles.questionNumber}>
                                Pergunta {currentQuestion + 1} de {questions.length}
                            </Text>
                            <View style={styles.progressIndicator}>
                                {questions.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.progressDot,
                                            index <= currentQuestion && styles.progressDotActive
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={styles.questionCard}>
                            <Text style={styles.questionText}>
                                {questions[currentQuestion]?.question}
                            </Text>
                        </View>

                        <View style={styles.optionsContainer}>
                            {questions[currentQuestion]?.options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.optionButton,
                                        selectedAnswers[currentQuestion] === index && styles.optionButtonSelected
                                    ]}
                                    onPress={() => handleAnswerSelect(currentQuestion, index)}
                                >
                                    <Text style={styles.optionText}>
                                        {String.fromCharCode(65 + index)}. {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.navigationContainer}>
                        {currentQuestion > 0 && (
                            <TouchableOpacity
                                style={styles.previousButton}
                                onPress={() => setCurrentQuestion(currentQuestion - 1)}
                            >
                                <Text style={styles.navigationButtonText}>Anterior</Text>
                            </TouchableOpacity>
                        )}

                        {currentQuestion < questions.length - 1 ? (
                            <TouchableOpacity
                                style={styles.nextButton}
                                onPress={() => setCurrentQuestion(currentQuestion + 1)}
                            >
                                <Text style={styles.navigationButtonText}>Próxima</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmit}
                            >
                                <Text style={styles.submitButtonText}>Finalizar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            ) : (
                <View style={styles.resultsContainer}>
                    <View style={styles.scoreCard}>
                        <Text style={styles.scoreTitle}>Resultado</Text>
                        <Text style={[styles.scoreValue, { color: score >= 70 ? '#4CAF50' : '#F44336' }]}>{score}%</Text>
                        <Text style={styles.scoreMessage}>
                            {score >= 70 ? 'Aprovado!' : 'Reprovado - Tente Novamente'}
                        </Text>
                    </View>

                    <View style={styles.detailsCard}>
                        <Text style={styles.detailsTitle}>Detalhes</Text>
                        <Text style={styles.detailsText}>
                            Você acertou {Math.round((score / 100) * questions.length)} de {questions.length} perguntas
                        </Text>
                        <Text style={styles.detailsText}>
                            Pontuação necessária: 70% para aprovação
                        </Text>
                    </View>

                    <View style={styles.explanationCard}>
                        <Text style={styles.explanationTitle}>Feedback de Aprendizagem</Text>
                        <View style={styles.explanationContainer}>
                            {questions.map((question, index) => (
                                <Text key={index} style={styles.explanationItem}>
                                    {index + 1}. {question.explanation}
                                </Text>
                            ))}
                        </View>
                    </View>

                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={handleRetry}
                        >
                            <Text style={styles.retryButtonText}>Refazer Quiz</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.continueButtonText}>Voltar ao Curso</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 40,
    },
    backButton: {
        fontSize: 16,
        color: '#1E3A8A',
        marginRight: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    questionContainer: {
        padding: 20,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    questionNumber: {
        fontSize: 16,
        color: '#757575',
    },
    progressIndicator: {
        flexDirection: 'row',
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 2,
    },
    progressDotActive: {
        backgroundColor: '#1E3A8A',
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    questionText: {
        fontSize: 16,
        color: '#333333',
        marginBottom: 20,
        lineHeight: 24,
    },
    optionsContainer: {
        marginBottom: 20,
    },
    optionButton: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        alignItems: 'flex-start',
    },
    optionButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#1E3A8A',
    },
    optionText: {
        fontSize: 16,
        color: '#333333',
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    previousButton: {
        backgroundColor: '#E0E0E0',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    nextButton: {
        backgroundColor: '#1E3A8A',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    navigationButtonText: {
        color: '#333333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultsContainer: {
        padding: 20,
    },
    scoreCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scoreTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 10,
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    scoreMessage: {
        fontSize: 16,
        color: '#757575',
    },
    detailsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 10,
    },
    detailsText: {
        fontSize: 16,
        color: '#333333',
        marginBottom: 5,
        lineHeight: 22,
    },
    explanationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    explanationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 10,
    },
    explanationContainer: {
        flex: 1,
    },
    explanationText: {
        fontSize: 14,
        color: '#333333',
        lineHeight: 20,
    },
    explanationItem: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 10,
        lineHeight: 20,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    retryButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginRight: 10,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    continueButton: {
        backgroundColor: '#1E3A8A',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
