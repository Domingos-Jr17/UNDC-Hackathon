export const colors = {
  background: '#F3F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF4FA',
  primary: '#1E3A8A',
  primaryDark: '#142B6F',
  primarySoft: '#E7ECFA',
  accent: '#F2B24A',
  accentSoft: '#FFF1D4',
  text: '#142235',
  textMuted: '#66758B',
  textOnPrimary: '#F8FBFF',
  border: '#D7E2EE',
  success: '#157A57',
  successSoft: '#DCF6EA',
  warning: '#B7791F',
  warningSoft: '#FFF2DA',
  danger: '#C24C4C',
  dangerSoft: '#FDE7E7',
  info: '#1E3A8A',
  infoSoft: '#E7ECFA'
} as const

export const spacing = {
  screen: 20,
  card: 18,
  section: 24
} as const

export const shadows = {
  card: {
    shadowColor: '#12314F',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  }
} as const
