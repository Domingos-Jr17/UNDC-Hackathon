import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type VideoLessonScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VideoLesson'>;
type VideoLessonScreenRouteProp = RouteProp<RootStackParamList, 'VideoLesson'>;

interface VideoLessonScreenProps {
    route: VideoLessonScreenRouteProp;
    navigation: VideoLessonScreenNavigationProp;
}

export default function VideoLessonScreen({ route, navigation }: VideoLessonScreenProps) {
    const { courseId, moduleId } = route.params;
    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);

    const handlePlayPause = () => {
        if (isPlaying) {
            videoRef.current?.pauseAsync();
        } else {
            videoRef.current?.playAsync();
        }
        setIsPlaying(!isPlaying);
    };

    const handleDownload = () => {
        // Simular download para acesso offline
        Alert.alert(
            'Download Iniciado',
            'O vídeo será baixado para acesso offline. Você será notificado quando concluído.',
            [
                { text: 'OK', onPress: () => setIsDownloaded(true) }
            ]
        );
    };

    const handleComplete = () => {
        Alert.alert(
            'Módulo Concluído',
            'Parabéns! Você completou este módulo com sucesso.',
            [
                { text: 'Continuar', onPress: () => navigation.goBack() }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Módulo {moduleId}</Text>
            </View>

            <View style={styles.videoContainer}>
                <Video
                    ref={videoRef}
                    source={{ uri: 'https://example.com/video.mp4' }}
                    style={styles.video}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={isPlaying}
                    onPlaybackStatusUpdate={(status) => {
                        if (status.isLoaded) {
                            setIsPlaying(status.isPlaying || false);
                        }
                    }}
                />

                <View style={styles.videoControls}>
                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={handlePlayPause}
                    >
                        <Text style={styles.controlText}>
                            {isPlaying ? 'Pausar' : 'Play'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={handleDownload}
                    >
                        <Text style={styles.controlText}>
                            {isDownloaded ? '✓ Baixado' : 'Baixar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.sectionTitle}>Conteúdo do Módulo</Text>

                <View style={styles.contentCard}>
                    <Text style={styles.contentTitle}>Objetivos de Aprendizagem</Text>
                    <Text style={styles.contentText}>
                        • Identificar componentes da máquina industrial{'\n'}
                        • Configurar tensão e velocidade adequadas{'\n'}
                        • Realizar costura reta com precisão{'\n'}
                        • Manusear ferramentas de segurança
                    </Text>
                </View>

                <View style={styles.contentCard}>
                    <Text style={styles.contentTitle}>Passo a Passo</Text>
                    <Text style={styles.contentText}>
                        1. Verificar fio na máquina{'\n'}
                        2. Enrolar linha reta{'\n'}
                        3. Costurar seguindo guia{'\n'}
                        4. Verificar pontos de parada
                    </Text>
                </View>

                <View style={styles.contentCard}>
                    <Text style={styles.contentTitle}>Dicas Importantes</Text>
                    <Text style={styles.contentText}>
                        • Mantenha os dedos afastados da agulha{'\n'}
                        • Use iluminação adequada para evitar fadiga{'\n'}
                        • Faça pausas regulares para descansar
                    </Text>
                </View>
            </View>

            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleComplete}
                >
                    <Text style={styles.actionButtonText}>Marcar como Concluído</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Quiz', { courseId, moduleId })}
                >
                    <Text style={styles.secondaryButtonText}>Fazer Quiz</Text>
                </TouchableOpacity>
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
    videoContainer: {
        backgroundColor: '#000000',
        borderRadius: 12,
        overflow: 'hidden',
        margin: 20,
    },
    video: {
        width: '100%',
        height: 200,
    },
    videoControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    controlButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        padding: 10,
        borderRadius: 20,
        marginHorizontal: 10,
    },
    controlText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    contentContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 15,
    },
    contentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    contentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 10,
    },
    contentText: {
        fontSize: 14,
        color: '#333333',
        lineHeight: 20,
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        marginTop: 20,
    },
    actionButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginRight: 10,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    secondaryButton: {
        backgroundColor: '#1E3A8A',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
