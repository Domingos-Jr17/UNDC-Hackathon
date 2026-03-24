const isTruthy = (value: string | undefined): boolean => {
  if (!value) {
    return false
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export const isFollowUpAlertsPhase2Enabled = isTruthy(process.env.FOLLOW_UP_ALERTS_PHASE2_ENABLED)
