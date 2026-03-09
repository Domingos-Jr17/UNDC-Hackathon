import { NextFunction, Response } from 'express'
import { AuthenticatedRequest } from '../../src/types'
import { requireRole, requireStaffRole } from '../../src/middleware/security'

type MockResponse = Response & {
  statusCode?: number
  body?: unknown
}

const createMockResponse = (): MockResponse => {
  const res = {} as MockResponse

  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code
    return res
  }) as Response['status']

  res.json = jest.fn().mockImplementation((payload: unknown) => {
    res.body = payload
    return res
  }) as Response['json']

  return res
}

describe('RBAC middleware', () => {
  test('should return 401 when user is missing', () => {
    const middleware = requireRole(['STAFF'])
    const req = {} as AuthenticatedRequest
    const res = createMockResponse()
    const next = jest.fn() as NextFunction

    middleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.body).toEqual({
      error: 'Token de autenticação não fornecido'
    })
  })

  test('should return 403 when role is not allowed', () => {
    const middleware = requireRole(['STAFF'])
    const req = {
      user: {
        anonymousCode: 'V0001',
        ngoId: 'ngo-001',
        role: 'VICTIM',
        sessionId: 'session-1'
      }
    } as AuthenticatedRequest
    const res = createMockResponse()
    const next = jest.fn() as NextFunction

    middleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.body).toEqual({
      error: 'Acesso não autorizado para esta função'
    })
  })

  test('should allow STAFF role on staff middleware', () => {
    const req = {
      user: {
        anonymousCode: 'A0001',
        ngoId: 'ngo-001',
        role: 'STAFF',
        sessionId: 'session-2'
      }
    } as AuthenticatedRequest
    const res = createMockResponse()
    const next = jest.fn() as NextFunction

    requireStaffRole(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  test('should allow ADMIN role on staff middleware', () => {
    const req = {
      user: {
        anonymousCode: 'A0002',
        ngoId: 'ngo-001',
        role: 'ADMIN',
        sessionId: 'session-3'
      }
    } as AuthenticatedRequest
    const res = createMockResponse()
    const next = jest.fn() as NextFunction

    requireStaffRole(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  test('should block VICTIM role on staff middleware', () => {
    const req = {
      user: {
        anonymousCode: 'V0002',
        ngoId: 'ngo-001',
        role: 'VICTIM',
        sessionId: 'session-4'
      }
    } as AuthenticatedRequest
    const res = createMockResponse()
    const next = jest.fn() as NextFunction

    requireStaffRole(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.body).toEqual({
      error: 'Acesso não autorizado para esta função'
    })
  })
})
