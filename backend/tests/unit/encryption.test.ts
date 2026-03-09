import encryptionService from '../../src/services/encryption'

describe('Encryption Service', () => {
  test('should encrypt and decrypt text', () => {
    const encrypted = encryptionService.encrypt('Beneficiaria A')
    expect(encrypted).not.toBeNull()

    if (!encrypted) {
      throw new Error('Encryption should not return null for non-empty values')
    }

    const decrypted = encryptionService.decrypt(encrypted)
    expect(decrypted).toBe('Beneficiaria A')
  })

  test('should return null for empty encryption input', () => {
    const encrypted = encryptionService.encrypt('')
    expect(encrypted).toBeNull()
  })

  test('should encrypt/decrypt user sensitive data', () => {
    const encryptedUser = encryptionService.encryptUserData({
      anonymous_code: 'V0042',
      real_name: 'Beneficiaria A',
      phone: '+258840000000',
      email: 'anon@example.org',
      ngo_id: 'ngo-001'
    })

    const decryptedUser = encryptionService.decryptUserData(encryptedUser)
    expect(decryptedUser.anonymous_code).toBe('V0042')
    expect(decryptedUser.real_name).toBe('Beneficiaria A')
    expect(decryptedUser.phone).toBe('+258840000000')
  })

  test('should generate secure code in expected format', () => {
    const code = encryptionService.generateSecureCode('V', 4)
    expect(code).toMatch(/^V\d{4}$/)
  })

  test('should generate deterministic hash for same identifier', () => {
    const hashA = encryptionService.hashIdentifier('V0042')
    const hashB = encryptionService.hashIdentifier('V0042')
    expect(hashA).toBe(hashB)
    expect(hashA).toHaveLength(16)
  })
})
