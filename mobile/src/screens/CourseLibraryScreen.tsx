import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type CourseLibraryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourseLibrary'>;

interface CourseLibraryScreenProps {
    navigation: CourseLibraryScreenNavigationProp;
}

export default function CourseLibraryScreen({ navigation }: CourseLibraryScreenProps) {
    const courses = [
        {
            id: 'costura',
            title: 'Costura Avançada',
            instructor: 'Professora Ana Machel',
            duration: '8 semanas',
            level: 'Iniciante',
            progress: 37.5,
            image: '🧵',
            description: 'Aprenda técnicas profissionais de costura para iniciar seu próprio negócio.',
            modules: 8,
            completedModules: 3,
            certificate: 'Reconhecido Ministério do Trabalho'
        },
        {
            id: 'culinaria',
            title: 'Culinária Profissional',
            instructor: 'Chef João Sitoe',
            duration: '7 semanas',
            level: 'Iniciante',
            progress: 0,
            image: '👨‍🍳',
            description: 'Domine técnicas culinárias e gere renda com alimentação.',
            modules: 7,
            completedModules: 0,
            certificate: 'Reconhecido Ministério do Trabalho'
        },
        {
            id: 'agricultura',
            title: 'Agricultura Sustentável',
            instructor: 'Eng. Maria Cossa',
            duration: '6 semanas',
            level: 'Iniciante',
            progress: 0,
            image: '🌱',
            description: 'Técnicas modernas de agricultura para auto-sustentabilidade e comercialização.',
            modules: 6,
            completedModules: 0,
            certificate: 'Reconhecido Ministério do Trabalho'
        }
    ];

    const handleCoursePress = (courseId: string) => {
        navigation.navigate('CourseDetail', { courseId });
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Biblioteca de Cursos</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Subtitle */}
            <View style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>
                    Escolha entre nossos cursos profissionais certificados
                </Text>
                <Text style={styles.certificateBadge}>
                    🏆 Todos com certificado oficial
                </Text>
            </View>

            {/* Courses Grid */}
            <View style={styles.coursesContainer}>
                {courses.map(course => (
                    <TouchableOpacity
                        key={course.id}
                        style={styles.courseCard}
                        onPress={() => handleCoursePress(course.id)}
                    >
                        {/* Course Header */}
                        <View style={styles.courseHeader}>
                            <View style={styles.courseIconContainer}>
                                <Text style={styles.courseIcon}>{course.image}</Text>
                            </View>
                            <View style={styles.courseInfo}>
                                <Text style={styles.courseTitle}>{course.title}</Text>
                                <Text style={styles.courseInstructor}>{course.instructor}</Text>
                            </View>
                            {course.progress > 0 && (
                                <View style={styles.progressBadge}>
                                    <Text style={styles.progressText}>{course.progress}%</Text>
                                </View>
                            )}
                        </View>

                        {/* Course Details */}
                        <View style={styles.courseDetails}>
                            <Text style={styles.courseDescription}>{course.description}</Text>

                            <View style={styles.courseMeta}>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Duração</Text>
                                    <Text style={styles.metaValue}>{course.duration}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Nível</Text>
                                    <Text style={styles.metaValue}>{course.level}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Módulos</Text>
                                    <Text style={styles.metaValue}>{course.modules}</Text>
                                </View>
                            </View>

                            {/* Progress Bar */}
                            {course.progress > 0 && (
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBackground}>
                                        <View
                                            style={[styles.progressFill, { width: `${course.progress}%` }]}
                                        />
                                    </View>
                                    <Text style={styles.progressLabel}>
                                        Módulo {course.completedModules + 1} de {course.modules}
                                    </Text>
                                </View>
                            )}

                            {/* Certificate Badge */}
                            <View style={styles.certificateContainer}>
                                <Text style={styles.certificateIcon}>🏆</Text>
                                <Text style={styles.certificateText}>{course.certificate}</Text>
                            </View>
                        </View>

                        {/* Action Button */}
                        <View style={styles.actionContainer}>
                            {course.progress > 0 ? (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.continueButton]}
                                    onPress={() => handleCoursePress(course.id)}
                                >
                                    <Text style={styles.continueButtonText}>Continuar Curso</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.startButton]}
                                    onPress={() => handleCoursePress(course.id)}
                                >
                                    <Text style={styles.startButtonText}>Iniciar Curso</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Footer Info */}
            <View style={styles.footer}>
                <Text style={styles.footerTitle}>💡 Benefícios dos Cursos</Text>
                <Text style={styles.footerText}>• Certificado reconhecido pelo Ministério do Trabalho</Text>
                <Text style={styles.footerText}>• Acesso vitalício ao material</Text>
                <Text style={styles.footerText}>• Suporte de instrutores qualificados</Text>
                <Text style={styles.footerText}>• Oportunidades de emprego e empreendedorismo</Text>
                <Text style={styles.footerText}>• Comunidade de apoio e networking</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#1E3A8A',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        marginRight: 40,
    },
    placeholder: {
        width: 40,
    },
    subtitleContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    subtitle: {
        fontSize: 16,
        color: '#333333',
        textAlign: 'center',
        marginBottom: 8,
    },
    certificateBadge: {
        fontSize: 14,
        color: '#1E3A8A',
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#E3F2FD',
        padding: 8,
        borderRadius: 8,
    },
    coursesContainer: {
        padding: 20,
    },
    courseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    courseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    courseIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    courseIcon: {
        fontSize: 24,
    },
    courseInfo: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginBottom: 4,
    },
    courseInstructor: {
        fontSize: 14,
        color: '#666666',
    },
    progressBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    progressText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    courseDetails: {
        padding: 20,
    },
    courseDescription: {
        fontSize: 14,
        color: '#333333',
        lineHeight: 20,
        marginBottom: 15,
    },
    courseMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    metaItem: {
        alignItems: 'center',
        flex: 1,
    },
    metaLabel: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E3A8A',
    },
    progressContainer: {
        marginBottom: 15,
    },
    progressBackground: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },
    progressLabel: {
        fontSize: 12,
        color: '#666666',
        textAlign: 'center',
    },
    certificateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    certificateIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    certificateText: {
        fontSize: 12,
        color: '#F57C00',
        fontWeight: 'bold',
        flex: 1,
    },
    actionContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    actionButton: {
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    continueButton: {
        backgroundColor: '#4CAF50',
    },
    startButton: {
        backgroundColor: '#1E3A8A',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        marginTop: 10,
    },
    footerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginBottom: 15,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
        paddingLeft: 10,
    },
});
