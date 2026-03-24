import React from 'react'
import {
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import apiService from '../services/api'
import sessionService from '../services/session'
import { colors, shadows, spacing } from '../theme'

type MainRoute = 'Home' | 'CourseLibrary' | 'Progress' | 'Jobs' | 'Support'

interface AppShellProps {
  navigation: {
    navigate: (routeName: keyof RootStackParamList) => void
    reset: (state: { index: number; routes: Array<{ name: keyof RootStackParamList }> }) => void
  }
  activeRoute: MainRoute
  title: string
  subtitle?: string
  children: React.ReactNode
  headerVariant?: 'hero' | 'compact'
  refreshing?: boolean
  onRefresh?: () => void
  contentContainerStyle?: StyleProp<ViewStyle>
  showBottomNav?: boolean
  showLogout?: boolean
}

const navItems: Array<{
  route: MainRoute
  label: string
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
}> = [
  { route: 'Home', label: 'Início', icon: 'home-outline', activeIcon: 'home' },
  { route: 'CourseLibrary', label: 'Cursos', icon: 'book-outline', activeIcon: 'book' },
  { route: 'Progress', label: 'Progresso', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  { route: 'Jobs', label: 'Vagas', icon: 'briefcase-outline', activeIcon: 'briefcase' },
  { route: 'Support', label: 'Apoio', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses' }
]

export default function AppShell({
  navigation,
  activeRoute,
  title,
  subtitle,
  children,
  headerVariant = 'compact',
  refreshing = false,
  onRefresh,
  contentContainerStyle,
  showBottomNav = true,
  showLogout = true
}: AppShellProps) {
  const bottomPadding = showBottomNav ? 116 : 32

  const handleLogout = async (): Promise<void> => {
    try {
      await apiService.logout()
    } catch {
      await sessionService.clearSession()
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    })
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        {headerVariant === 'hero' ? (
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderInner}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>WIRA</Text>
                <Text style={styles.heroTitle}>{title}</Text>
                {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
              </View>
              {showLogout ? (
                <TouchableOpacity style={styles.logoutPill} onPress={() => void handleLogout()}>
                  <Ionicons name="log-out-outline" size={18} color={colors.textOnPrimary} />
                  <Text style={styles.logoutText}>Sair</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.compactHeader}>
            <View style={styles.compactHeaderText}>
              <Text style={styles.compactTitle}>{title}</Text>
              {subtitle ? <Text style={styles.compactSubtitle}>{subtitle}</Text> : null}
            </View>
            {showLogout ? (
              <TouchableOpacity style={styles.logoutIconButton} onPress={() => void handleLogout()}>
                <Ionicons name="log-out-outline" size={20} color={colors.primaryDark} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomPadding }, contentContainerStyle]}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {showBottomNav ? (
          <View style={styles.bottomNavWrap}>
            <View style={styles.bottomNav}>
              {navItems.map(item => {
                const isActive = item.route === activeRoute
                return (
                  <TouchableOpacity
                    key={item.route}
                    style={[styles.navItem, isActive && styles.navItemActive]}
                    onPress={() => navigation.navigate(item.route)}
                  >
                    <Ionicons
                      name={isActive ? item.activeIcon : item.icon}
                      size={20}
                      color={isActive ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  heroHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28
  },
  heroHeaderInner: {
    gap: 18
  },
  heroCopy: {
    gap: 8
  },
  heroEyebrow: {
    color: '#C9E3F7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: colors.textOnPrimary,
    fontSize: 30,
    fontWeight: '800'
  },
  heroSubtitle: {
    color: '#D9ECFA',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320
  },
  logoutPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  logoutText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700'
  },
  compactHeader: {
    marginHorizontal: spacing.screen,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 24,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  compactHeaderText: {
    flex: 1,
    gap: 4,
    paddingRight: 12
  },
  compactTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800'
  },
  compactSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  logoutIconButton: {
    height: 42,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted
  },
  scrollView: {
    flex: 1
  },
  contentContainer: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
    gap: 20
  },
  bottomNavWrap: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    bottom: 18
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 24,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 10,
    gap: 4
  },
  navItemActive: {
    backgroundColor: colors.primarySoft
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted
  },
  navLabelActive: {
    color: colors.primary
  }
})

