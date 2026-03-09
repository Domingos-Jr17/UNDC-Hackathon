import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressData {
  courses: Array<{
    id: string;
    title: string;
    progress: number;
    modulesCompleted: number;
    totalModules: number;
    lastAccessed: string;
    timeSpent: number; // em minutos
  }>;
  weeklyActivity: Array<{
    day: string;
    minutes: number;
    modules: number;
  }>;
  overallStats: {
    totalTimeSpent: number;
    averageSessionTime: number;
    streak: number;
    certificatesEarned: number;
  };
}

const mockProgressData: ProgressData = {
  courses: [
    {
      id: '1',
      title: 'Costura Avançada',
      progress: 37.5,
      modulesCompleted: 3,
      totalModules: 8,
      lastAccessed: 'Hoje',
      timeSpent: 225, // 3h 45min
    },
    {
      id: '2',
      title: 'Culinária Profissional',
      progress: 0,
      modulesCompleted: 0,
      totalModules: 6,
      lastAccessed: 'Nunca',
      timeSpent: 0,
    },
    {
      id: '3',
      title: 'Agricultura Sustentável',
      progress: 0,
      modulesCompleted: 0,
      totalModules: 7,
      lastAccessed: 'Nunca',
      timeSpent: 0,
    },
  ],
  weeklyActivity: [
    { day: 'Seg', minutes: 45, modules: 2 },
    { day: 'Ter', minutes: 30, modules: 1 },
    { day: 'Qua', minutes: 60, modules: 3 },
    { day: 'Qui', minutes: 0, modules: 0 },
    { day: 'Sex', minutes: 90, modules: 4 },
    { day: 'Sáb', minutes: 0, modules: 0 },
    { day: 'Dom', minutes: 15, modules: 1 },
  ],
  overallStats: {
    totalTimeSpent: 240, // 4 horas no total
    averageSessionTime: 40, // 40 minutos por sessão
    streak: 3, // 3 dias seguidos
    certificatesEarned: 0,
  },
};

export default function ProgressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simular atualização de dados
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#1E3A8A',
    },
  };

  const pieData = [
    {
      name: 'Costura',
      population: 37.5,
      color: '#1E3A8A',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Culinária',
      population: 0,
      color: '#E5E7EB',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Agricultura',
      population: 0,
      color: '#E5E7EB',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
  ];

  const weeklyData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [45, 30, 60, 0, 90, 0, 15],
        color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 70) return '#10B981';
    if (progress >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Progresso</Text>
          <TouchableOpacity>
            <Feather name="download" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mockProgressData.overallStats.totalTimeSpent}min</Text>
            <Text style={styles.statLabel}>Tempo Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mockProgressData.overallStats.streak}</Text>
            <Text style={styles.statLabel}>Dias Seguidos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mockProgressData.overallStats.certificatesEarned}</Text>
            <Text style={styles.statLabel}>Certificados</Text>
          </View>
        </View>

        {/* Weekly Activity Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Atividade Semanal</Text>
          <LineChart
            data={weeklyData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
          <Text style={styles.chartSubtitle}>Minutos por dia</Text>
        </View>

        {/* Course Progress Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progresso por Curso</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
            absolute
          />
        </View>

        {/* Detailed Course Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes dos Cursos</Text>
          {mockProgressData.courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
            >
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseTime}>{formatTime(course.timeSpent)}</Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${course.progress}%`,
                      backgroundColor: getProgressColor(course.progress),
                    },
                  ]}
                />
              </View>

              <View style={styles.courseStats}>
                <Text style={styles.courseStatsText}>
                  {course.modulesCompleted}/{course.totalModules} módulos
                </Text>
                <Text style={styles.courseStatsText}>{course.progress.toFixed(1)}%</Text>
              </View>

              <Text style={styles.courseLastAccess}>
                Último acesso: {course.lastAccessed}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Feather name="trending-up" size={20} color="#10B981" />
            <Text style={styles.insightText}>
              Você estudou {formatTime(mockProgressData.weeklyActivity.reduce((acc, day) => acc + day.minutes, 0))} esta semana!
            </Text>
          </View>
          <View style={styles.insightCard}>
            <Feather name="target" size={20} color="#1E3A8A" />
            <Text style={styles.insightText}>
              Mantenha seu ritmo de {mockProgressData.overallStats.streak} dias seguidos!
            </Text>
          </View>
          <View style={styles.insightCard}>
            <Feather name="clock" size={20} color="#F59E0B" />
            <Text style={styles.insightText}>
              Sessão média: {formatTime(mockProgressData.overallStats.averageSessionTime)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  courseTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseStatsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  courseLastAccess: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
});