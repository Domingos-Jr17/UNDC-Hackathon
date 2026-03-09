import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type CourseDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourseDetail'>;
type CourseDetailScreenRouteProp = RouteProp<RootStackParamList, 'CourseDetail'>;

interface CourseDetailScreenProps {
    route: CourseDetailScreenRouteProp;
    navigation: CourseDetailScreenNavigationProp;
}

export default function CourseDetailScreen({ navigation, route }: CourseDetailScreenProps) {
    const { courseId } = route.params;
    const [activeTab, setActiveTab] = useState('modules');
    const [selectedModuleId, setSelectedModuleId] = useState<string>('1'); // Módulo padrão

    // Dados demo para hackathon
    const coursesData = {
        costura: {
            title: 'Costura Avançada',
            instructor: 'Professora Ana Machel',
            totalModules: 8,
            completedModules: 3,
            progress: 37.5,
            icon: '🧵',
            description: 'Curso completo de costura profissional para iniciar seu próprio negócio.',
            modules: [
                { id: 1, title: 'Introdução à Máquina de Costura', duration: '45 min', completed: true },
                { id: 2, title: 'Tipos de Tecidos e Suas Aplicações', duration: '60 min', completed: true },
                { id: 3, title: 'Pontos Básicos e Costura Retal', duration: '90 min', completed: true },
                { id: 4, title: 'Montagem de Blusas Simples', duration: '120 min', completed: false },
                { id: 5, title: 'Montagem de Calças Jeans', duration: '180 min', completed: false },
                { id: 6, title: 'Acabamentos Profissionais', duration: '90 min', completed: false },
                { id: 7, title: 'Criando seu Próprio Negócio', duration: '60 min', completed: false },
                { id: 8, title: 'Projeto Final e Certificação', duration: '120 min', completed: false },
            ],
            materials: [
                { id: 1, title: 'Guia de Máquinas de Costura', type: 'PDF', size: '2.3 MB' },
                { id: 2, title: 'Catálogo de Tecidos', type: 'PDF', size: '5.1 MB' },
                { id: 3, title: 'Vídeo: Pontos Básicos', type: 'MP4', size: '125 MB' },
            ]
        },
        culinaria: {
            title: 'Culinária Profissional',
            instructor: 'Chef João Sitoe',
            totalModules: 7,
            completedModules: 0,
            progress: 0,
            icon: '👨‍🍳',
            description: 'Aprenda técnicas culinárias profissionais para gerar renda.',
            modules: [
                { id: 1, title: 'Higiene e Segurança na Cozinha', duration: '30 min', completed: false },
                { id: 2, title: 'Ferramentas e Equipamentos', duration: '45 min', completed: false },
                { id: 3, title: 'Técnicas de Corte', duration: '60 min', completed: false },
                { id: 4, title: 'Temperos e Condimentos', duration: '45 min', completed: false },
                { id: 5, title: 'Pratos Tradicionais Moçambicanos', duration: '120 min', completed: false },
                { id: 6, title: 'Apresentação de Pratos', duration: '60 min', completed: false },
                { id: 7, title: 'Gestão de Negócio de Alimentação', duration: '90 min', completed: false },
            ],
            materials: [
                { id: 1, title: 'Guia de Higiene na Cozinha', type: 'PDF', size: '1.8 MB' },
                { id: 2, title: 'Receitas Tradicionais', type: 'PDF', size: '3.2 MB' },
            ]
        },
        agricultura: {
            title: 'Agricultura Sustentável',
            instructor: 'Eng. Maria Cossa',
            totalModules: 6,
            completedModules: 0,
            progress: 0,
            icon: '🌱',
            description: 'Técnicas modernas de agricultura para sustentabilidade.',
            modules: [
                { id: 1, title: 'Preparação do Solo', duration: '60 min', completed: false },
                { id: 2, title: 'Irrigação e Gestão da Água', duration: '45 min', completed: false },
                { id: 3, title: 'Seleção de Sementes', duration: '30 min', completed: false },
                { id: 4, title: 'Controle Natural de Pragas', duration: '60 min', completed: false },
                { id: 5, title: 'Colheita e Armazenamento', duration: '45 min', completed: false },
                { id: 6, title: 'Comercialização da Produção', duration: '90 min', completed: false },
            ],
            materials: [
                { id: 1, title: 'Guia de Preparação do Solo', type: 'PDF', size: '2.1 MB' },
                { id: 2, title: 'Calendário Agrícola', type: 'PDF', size: '1.5 MB' },
            ]
        }
    };

    const course = coursesData[courseId as keyof typeof coursesData] || coursesData.costura;

    const handleBack = () => {
        navigation.goBack();
    };

    const handleModulePress = (moduleId: number) => {
        const module = course.modules.find((m: any) => m.id === moduleId);
        if (!module) {
            Alert.alert('Erro', 'Módulo não encontrado.');
            return;
        }

        // Define o módulo selecionado para o quiz
        setSelectedModuleId(moduleId.toString());

        if (module.completed) {
            Alert.alert('Módulo Concluído', 'Você já completou este módulo. Deseja refazer o quiz?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Refazer Quiz', onPress: () => handleStartQuiz() }
            ]);
        } else {
            Alert.alert('Iniciar Módulo', `Iniciar "${module.title}"?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Fazer Quiz', onPress: () => handleStartQuiz() },
                { text: 'Ver Aula', onPress: () => {
                    navigation.navigate('VideoLesson', {
                        courseId: courseId,
                        moduleId: moduleId.toString()
                    });
                }}
            ]);
        }
    };

    const handleMaterialDownload = (material: { id: number, title: string }) => {
        Alert.alert('Download', `Baixando ${material.title}...`);
    };

    const handleStartQuiz = () => {
        Alert.alert(
            'Iniciar Quiz',
            `Deseja iniciar a avaliação do módulo ${selectedModuleId}?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Iniciar',
                    onPress: () => {
                        navigation.navigate('Quiz', {
                            courseId: courseId,
                            moduleId: selectedModuleId
                        });
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack}>
                    <Text style={styles.backButton}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{course.title}</Text>
                <View style={{ width: 30 }} />
            </View>

            {/* Course Info */}
            <View style={styles.courseInfo}>
                <Text style={styles.courseIcon}>{course.icon}</Text>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseInstructor}>{course.instructor}</Text>
                <Text style={styles.courseDescription}>{course.description}</Text>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressTitle}>Seu Progresso</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {course.completedModules} de {course.totalModules} módulos concluídos ({course.progress}%)
                </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'modules' && styles.activeTab]}
                    onPress={() => setActiveTab('modules')}
                >
                    <Text style={[styles.tabText, activeTab === 'modules' && styles.activeTabText]}>
                        Módulos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'materials' && styles.activeTab]}
                    onPress={() => setActiveTab('materials')}
                >
                    <Text style={[styles.tabText, activeTab === 'materials' && styles.activeTabText]}>
                        Materiais
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'modules' ? (
                <View style={styles.modulesContainer}>
                    {course.modules.map((module: any) => (
                        <TouchableOpacity
                            key={module.id}
                            style={styles.moduleCard}
                            onPress={() => handleModulePress(module.id)}
                        >
                            <View style={styles.moduleHeader}>
                                <View style={styles.moduleNumber}>
                                    <Text style={styles.moduleNumberText}>{module.id}</Text>
                                </View>
                                <View style={styles.moduleTitle}>
                                    <Text style={styles.moduleTitleText}>{module.title}</Text>
                                </View>
                                {module.completed && (
                                    <View style={styles.completedBadge}>
                                        <Text style={styles.completedText}>✓</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.moduleDuration}>Duração: {module.duration}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View style={styles.materialsContainer}>
                    {course.materials.map((material: any) => (
                        <TouchableOpacity
                            key={material.id}
                            style={styles.materialCard}
                            onPress={() => handleMaterialDownload(material)}
                        >
                            <View style={styles.materialHeader}>
                                <Text style={styles.materialTitle}>{material.title}</Text>
                                <Text style={styles.materialType}>{material.type}</Text>
                            </View>
                            <Text style={styles.materialSize}>Tamanho: {material.size}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Action Button */}
            {course.completedModules < course.totalModules && (
                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.quizButton} onPress={handleStartQuiz}>
                        <Text style={styles.quizButtonText}>Fazer Quiz do Módulo Atual</Text>
                    </TouchableOpacity>
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
        paddingTop: 60,
        backgroundColor: '#1E3A8A',
    },
    backButton: {
        fontSize: 24,
        color: '#FFFFFF',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
        marginRight: 30,
    },
    courseInfo: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    courseIcon: {
        fontSize: 48,
        marginBottom: 10,
    },
    courseTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginBottom: 5,
        textAlign: 'center',
    },
    courseInstructor: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 10,
    },
    courseDescription: {
        fontSize: 14,
        color: '#333333',
        textAlign: 'center',
        lineHeight: 20,
    },
    progressContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        margin: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginBottom: 10,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#1E3A8A',
    },
    tabText: {
        fontSize: 14,
        color: '#666666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    modulesContainer: {
        paddingHorizontal: 20,
    },
    moduleCard: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    moduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    moduleNumber: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    moduleNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E3A8A',
    },
    moduleTitle: {
        flex: 1,
    },
    moduleTitleText: {
        fontSize: 14,
        color: '#333333',
        fontWeight: '500',
    },
    completedBadge: {
        backgroundColor: '#4CAF50',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    moduleDuration: {
        fontSize: 12,
        color: '#666666',
        marginTop: 5,
    },
    materialsContainer: {
        paddingHorizontal: 20,
    },
    materialCard: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    materialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    materialTitle: {
        fontSize: 14,
        color: '#333333',
        fontWeight: '500',
        flex: 1,
    },
    materialType: {
        fontSize: 12,
        color: '#1E3A8A',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    materialSize: {
        fontSize: 12,
        color: '#666666',
    },
    actionContainer: {
        padding: 20,
    },
    quizButton: {
        backgroundColor: '#1E3A8A',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    quizButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
