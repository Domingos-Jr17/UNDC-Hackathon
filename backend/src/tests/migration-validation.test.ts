describe('Migration validation smoke test', () => {
  test('should import core modules without throwing', async () => {
    const modules = await Promise.all([
      import('../controllers/AuthController'),
      import('../controllers/CourseController'),
      import('../controllers/ProgressController'),
      import('../controllers/CertificateController'),
      import('../routes/auth'),
      import('../routes/courses'),
      import('../routes/progress'),
      import('../routes/certificates')
    ])

    expect(modules.length).toBe(8)
  })
})
