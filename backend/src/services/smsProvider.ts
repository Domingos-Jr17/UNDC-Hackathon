import { logger } from '../middleware/security'

export interface SmsSendPayload {
  phoneNumber: string
  message: string
}

export interface SmsSendResult {
  mode: 'sandbox' | 'provider-ready' | 'provider'
  provider: string
  messageId: string
  sentAt: string
  to: string
  body: string
}

const DEFAULT_PROVIDER = 'africastalking'

const getProviderName = (): string => (process.env.SMS_PROVIDER ?? DEFAULT_PROVIDER).toLowerCase()

const hasProviderConfig = (): boolean =>
  Boolean(process.env.SMS_API_KEY && process.env.SMS_USERNAME)

const sendViaAfricasTalking = async (payload: SmsSendPayload): Promise<SmsSendResult> => {
  const apiKey = process.env.SMS_API_KEY
  const username = process.env.SMS_USERNAME
  const sender = process.env.SMS_SENDER ?? 'WIRA'

  if (!apiKey || !username) {
    throw new Error('SMS provider credentials are not configured')
  }

  const form = new URLSearchParams({
    username,
    to: payload.phoneNumber,
    message: payload.message,
    from: sender
  })

  const response = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  })

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(`SMS provider error ${response.status}: ${raw}`)
  }

  let parsedMessageId = `sms-${Date.now()}`
  try {
    const parsed = JSON.parse(raw) as {
      SMSMessageData?: {
        Recipients?: Array<{ messageId?: string }>
      }
    }
    parsedMessageId = parsed.SMSMessageData?.Recipients?.[0]?.messageId ?? parsedMessageId
  } catch {
    // Keep generated ID when provider response is not JSON.
  }

  return {
    mode: 'provider',
    provider: 'africastalking',
    messageId: parsedMessageId,
    sentAt: new Date().toISOString(),
    to: payload.phoneNumber,
    body: payload.message
  }
}

class SmsProviderService {
  getStatus(): { providerMode: 'configured' | 'sandbox'; provider: string } {
    return {
      providerMode: hasProviderConfig() ? 'configured' : 'sandbox',
      provider: getProviderName()
    }
  }

  async send(payload: SmsSendPayload): Promise<SmsSendResult> {
    const provider = getProviderName()

    if (!hasProviderConfig()) {
      return {
        mode: 'sandbox',
        provider: 'sandbox',
        messageId: `sms-${Date.now()}`,
        sentAt: new Date().toISOString(),
        to: payload.phoneNumber,
        body: payload.message
      }
    }

    if (provider === 'africastalking') {
      const result = await sendViaAfricasTalking(payload)
      logger.info('SMS sent via provider', {
        provider: result.provider,
        to: result.to,
        messageId: result.messageId
      })
      return result
    }

    return {
      mode: 'provider-ready',
      provider,
      messageId: `sms-${Date.now()}`,
      sentAt: new Date().toISOString(),
      to: payload.phoneNumber,
      body: payload.message
    }
  }
}

const smsProviderService = new SmsProviderService()

export default smsProviderService
