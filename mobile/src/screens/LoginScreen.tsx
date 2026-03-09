import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
    const [accessCode, setAccessCode] = useState('');

    // Códigos demo para hackathon
    const demoCodes = ['V0042', 'V0038', 'V0031'];

    const handleLogin = () => {
        if (!accessCode.trim()) {
            Alert.alert('Erro', 'Por favor, insira seu código de acesso');
            return;
        }

        // Validação simulada
        if (accessCode.startsWith('V') && accessCode.length === 5) {
            // Salvar código no storage
            // AsyncStorage.setItem('userCode', accessCode);

            // Navegar para home
            navigation.navigate('Home');
        } else {
            Alert.alert('Código Inválido', 'Códigos demo disponíveis: V0042, V0038, V0031');
        }
    };

    const handleDemoLogin = (code: string) => {
        setAccessCode(code);
        setTimeout(() => {
            navigation.navigate('Home');
        }, 500);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Acesso WIRA</Text>
                <Text style={styles.subtitle}>
                    Insira seu código anônimo de acesso
                </Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Código (ex: V0042)"
                    value={accessCode}
                    onChangeText={setAccessCode}
                    autoCapitalize="characters"
                    maxLength={5}
                />

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginButtonText}>Entrar</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.demoText}>Acesso Demo (Hackathon):</Text>

                <View style={styles.demoButtons}>
                    {demoCodes.map((code) => (
                        <TouchableOpacity
                            key={code}
                            style={styles.demoButton}
                            onPress={() => handleDemoLogin(code)}
                        >
                            <Text style={styles.demoButtonText}>{code}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>← Voltar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E3A8A',
        padding: 20,
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#90CAF9',
        textAlign: 'center',
    },
    form: {
        flex: 1,
        justifyContent: 'center',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    loginButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 8,
        marginBottom: 30,
    },
    loginButtonText: {
        color: '#1E3A8A',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#90CAF9',
        marginVertical: 20,
    },
    demoText: {
        color: '#90CAF9',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
    },
    demoButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    demoButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    demoButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    backButton: {
        marginBottom: 40,
    },
    backButtonText: {
        color: '#90CAF9',
        fontSize: 16,
        textAlign: 'center',
    },
});
