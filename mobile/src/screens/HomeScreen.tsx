import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const stats = {
        coursesCompleted: 1,
        coursesInProgress: 2,
        certificatesEarned: 1,
        totalHours: 15
    };

    const currentCourse = {
        title: 'Costura Avançada',
        progress: 37.5,
        nextModule: 'Montagem de Camisas'
    };

    const handleCourseLibrary = () => {
        navigation.navigate('CourseLibrary');
    };

    const handleProgress = () => {
        navigation.navigate('Progress' as any);
    };

    const handleCertificates = () => {
        navigation.navigate('Certificate', { courseId: 'costura' });
    };

    const handleJobs = () => {
        navigation.navigate('JobsMockup');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Olá, V0042! 👋</Text>
                <Text style={styles.subtitle}>Pronta para construir seu futuro?</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.coursesCompleted}</Text>
                    <Text style={styles.statLabel}>Cursos Concluídos</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.coursesInProgress}</Text>
                    <Text style={styles.statLabel}>Em Progresso</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.certificatesEarned}</Text>
                    <Text style={styles.statLabel}>Certificados</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.totalHours}h</Text>
                    <Text style={styles.statLabel}>Horas Estudadas</Text>
                </View>
            </View>

            <View style={styles.currentCourseContainer}>
                <Text style={styles.sectionTitle}>Continue Aprendendo</Text>

                <View style={styles.courseCard}>
                    <Text style={styles.courseTitle}>{currentCourse.title}</Text>
                    <Text style={styles.courseSubtitle}>Módulo 3 de 8 • 65% completo</Text>

                    <View style={styles.progressBar}>
                        <View
                            style={[styles.progressFill, { width: `${currentCourse.progress}%` }]}
                        />
                    </View>

                    <Text style={styles.progressText}>
                        Próximo: {currentCourse.nextModule}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => navigation.navigate('CourseDetail', { courseId: 'costura' })}
                >
                    <Text style={styles.continueButtonText}>Continuar Curso →</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.quickActionsContainer}>
                <Text style={styles.sectionTitle}>Ações Rápidas</Text>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCourseLibrary}
                >
                    <Text style={styles.actionIcon}>📚</Text>
                    <Text style={styles.actionText}>Biblioteca de Cursos</Text>
                    <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCertificates}
                >
                    <Text style={styles.actionIcon}>🏆</Text>
                    <Text style={styles.actionText}>Meus Certificados</Text>
                    <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDisabled]}
                    onPress={handleJobs}
                    disabled={true}
                >
                    <Text style={styles.actionIcon}>💼</Text>
                    <Text style={styles.actionText}>Vagas Compatíveis</Text>
                    <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    MOCKUP - Fase 2: Em desenvolvimento
                </Text>
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
        padding: 20,
        paddingTop: 60,
        paddingBottom: 30,
    },
    welcomeText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        color: '#90CAF9',
        fontSize: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    statCard: {
        width: '48%',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666666',
        textAlign: 'center',
    },
    currentCourseContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginBottom: 16,
    },
    courseCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    courseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginBottom: 8,
    },
    courseSubtitle: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E3F2FD',
        borderRadius: 4,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#1E3A8A',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#666666',
    },
    continueButton: {
        backgroundColor: '#1E3A8A',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    quickActionsContainer: {
        padding: 20,
    },
    actionButton: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    actionText: {
        flex: 1,
        fontSize: 16,
        color: '#1E3A8A',
        fontWeight: '500',
    },
    actionArrow: {
        fontSize: 18,
        color: '#90CAF9',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999999',
        fontStyle: 'italic',
    },
});
