import crypto from 'crypto'
import winston from 'winston'
import { User, EncryptedData, EncryptionResult } from '../types'

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm'
  private readonly key: Buffer

  constructor() {
    this.key = this.getEncryptionKey()

    if (!this.key) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }
  }

  /**
   * Get encryption key from environment
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
      logger.error('ENCRYPTION_KEY not set in environment variables')
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }

    const salt = process.env.ENCRYPTION_SALT ?? 'wira-platform-v1'

    // Ensure deterministic 32-byte key for AES-256 across restarts.
    return crypto.scryptSync(key, salt, 32)
  }

  /**
   * Encrypt sensitive data
   * @param text - Plain text to encrypt
   * @returns Encrypted data object with iv, tag, and encrypted data
   */
  encrypt(text: string): EncryptionResult | null {
    try {
      if (!text) return null

      // Generate random IV
      const iv = crypto.randomBytes(16)

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
      cipher.setAAD(Buffer.from('wira-platform', 'utf8'))

      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // Get authentication tag
      const tag = cipher.getAuthTag()

      const result: EncryptionResult = {
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        encryptedData: encrypted
      }

      logger.debug('Data encrypted successfully', {
        dataLength: text.length,
        resultLength: JSON.stringify(result).length
      })

      return result
    } catch (error) {
      logger.error('Encryption error', {
        error: (error as Error).message,
        stack: (error as Error).stack
      })
      throw new Error('Falha ao criptografar dados')
    }
  }

  /**
   * Decrypt sensitive data
   * @param encryptedData - Object with iv, tag, and encryptedData
   * @returns Decrypted plain text
   */
  decrypt(encryptedData: EncryptedData): string | null {
    try {
      if (!encryptedData?.iv || !encryptedData.tag || !encryptedData.encryptedData) {
        return null
      }

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(encryptedData.iv, 'hex'))
      decipher.setAAD(Buffer.from('wira-platform', 'utf8'))
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))

      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      logger.debug('Data decrypted successfully', {
        resultLength: decrypted.length
      })

      return decrypted
    } catch (error) {
      logger.error('Decryption error', {
        error: (error as Error).message,
        stack: (error as Error).stack
      })
      throw new Error('Falha ao descriptografar dados')
    }
  }

  /**
   * Encrypt a user object
   * @param user - User object with sensitive data
   * @returns User object with encrypted sensitive fields
   */
  encryptUserData(user: Partial<User>): Partial<User> {
    try {
      const encryptedUser = { ...user }

      // Encrypt sensitive fields
      if (user.real_name) {
        encryptedUser.real_name = JSON.stringify(this.encrypt(user.real_name))
      }

      if (user.phone) {
        encryptedUser.phone = JSON.stringify(this.encrypt(user.phone))
      }

      if (user.email) {
        encryptedUser.email = JSON.stringify(this.encrypt(user.email))
      }

      // Remove sensitive fields that shouldn't be stored
      delete (encryptedUser as Partial<User> & { traffic_history?: unknown; family_contacts?: unknown; exact_address?: unknown }).traffic_history
      delete (encryptedUser as Partial<User> & { traffic_history?: unknown; family_contacts?: unknown; exact_address?: unknown }).family_contacts
      delete (encryptedUser as Partial<User> & { traffic_history?: unknown; family_contacts?: unknown; exact_address?: unknown }).exact_address

      logger.info('User data encrypted', {
        anonymousCode: user.anonymous_code,
        fieldsEncrypted: ['real_name', 'phone', 'email'].filter(field => user[field as keyof User])
      })

      return encryptedUser
    } catch (error) {
      logger.error('User data encryption error', {
        error: (error as Error).message,
        anonymousCode: user.anonymous_code
      })
      throw error
    }
  }

  /**
   * Decrypt user data (for internal use only)
   * @param encryptedUser - User object with encrypted sensitive data
   * @returns User object with decrypted sensitive fields
   */
  decryptUserData(encryptedUser: Partial<User>): Partial<User> {
    try {
      const user = { ...encryptedUser }

      // Decrypt sensitive fields
      if (encryptedUser.real_name) {
        try {
          const encrypted = JSON.parse(encryptedUser.real_name) as EncryptedData
          user.real_name = this.decrypt(encrypted) ?? '[DECRYPT_ERROR]'
        } catch {
          user.real_name = '[DECRYPT_ERROR]'
        }
      }

      if (encryptedUser.phone) {
        try {
          const encrypted = JSON.parse(encryptedUser.phone) as EncryptedData
          user.phone = this.decrypt(encrypted) ?? '[DECRYPT_ERROR]'
        } catch {
          user.phone = '[DECRYPT_ERROR]'
        }
      }

      if (encryptedUser.email) {
        try {
          const encrypted = JSON.parse(encryptedUser.email) as EncryptedData
          user.email = this.decrypt(encrypted) ?? '[DECRYPT_ERROR]'
        } catch {
          user.email = '[DECRYPT_ERROR]'
        }
      }

      return user
    } catch (error) {
      logger.error('User data decryption error', {
        error: (error as Error).message,
        anonymousCode: encryptedUser.anonymous_code
      })
      throw error
    }
  }

  /**
   * Generate secure random code
   * @param prefix - Code prefix (e.g., 'V')
   * @param length - Number of digits
   * @returns Random code
   */
  generateSecureCode(prefix: string = 'V', length: number = 4): string {
    const digits = crypto.randomInt(0, Math.pow(10, length))
    return `${prefix}${digits.toString().padStart(length, '0')}`
  }

  /**
   * Hash sensitive identifiers for audit logs
   * @param identifier - Sensitive identifier
   * @returns Hashed identifier
   */
  hashIdentifier(identifier: string): string | null {
    if (!identifier) return null

    return crypto
      .createHash('sha256')
      .update(identifier + (process.env.ENCRYPTION_KEY ?? ''))
      .digest('hex')
      .substring(0, 16)
  }

  /**
   * Validate encryption key strength
   * @returns Boolean indicating if key is secure
   */
  validateKeyStrength(): boolean {
    const key = process.env.ENCRYPTION_KEY
    if (!key) return false

    return key.length >= 32 && /[A-Za-z]/.test(key) && /\d/.test(key)
  }

  /**
   * Generate a random key for testing purposes
   * @returns Random 32-character key
   */
  static generateTestKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Create a one-time token for password reset or email verification
   * @param expiresIn - Token expiration in seconds
   * @returns One-time token object
   */
  generateOneTimeToken(expiresIn: number = 3600): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    return { token, expiresAt }
  }

  /**
   * Compare data securely (timing-attack resistant)
   * @param data1 - First data to compare
   * @param data2 - Second data to compare
   * @returns Boolean indicating if data matches
   */
  secureCompare(data1: string, data2: string): boolean {
    if (data1.length !== data2.length) {
      return false
    }

    return crypto.timingSafeEqual(Buffer.from(data1), Buffer.from(data2))
  }

  /**
   * Get encryption algorithm information
   * @returns Encryption algorithm details
   */
  getAlgorithmInfo(): { name: string; keyLength: number; ivLength: number; tagLength: number } {
    return {
      name: this.algorithm,
      keyLength: this.key.length * 8, // in bits
      ivLength: 16, // in bytes
      tagLength: 16 // in bytes
    }
  }
}

// Singleton instance
const encryptionService = new EncryptionService()

export default encryptionService
export { EncryptionService }
