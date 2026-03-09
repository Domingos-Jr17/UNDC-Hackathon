import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../middleware/security';
import { LoginRequest, LoginResponse, JWTayload } from '../types';
import UserModel from '../models/User';

class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const { code } = req.body as LoginRequest;
    const normalizedCode = code.toUpperCase();

    logger.info('Login attempt', {
      anonymousCode: normalizedCode,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    try {
      // Query database for user using ORM-like method
      const user = await UserModel.findUnique({
        anonymous_code: normalizedCode
      });

      if (!user) {
        logger.warn('Login attempt with invalid code', {
          anonymousCode: normalizedCode,
          ip: req.ip
        });
        res.status(401).json({
          error: 'Código de acesso inválido'
        });
        return;
      }
      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        logger.warn('Login attempt on locked account', {
          anonymousCode: normalizedCode,
          ip: req.ip
        });
        res.status(401).json({
          error: 'Conta bloqueada. Tente novamente mais tarde.'
        });
        return;
      }

      // Generate JWT token with secure secret
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET environment variable is not set');
        res.status(500).json({
          error: 'Erro interno do servidor'
        });
        return;
      }

      const token = jwt.sign(
        {
          anonymousCode: user.anonymous_code,
          ngoId: user.ngo_id,
          role: user.role,
          sessionId: Math.random().toString(36).substring(2, 15)
        } as JWTayload,
        jwtSecret,
        {
          expiresIn: '24h',
          issuer: 'wira-platform',
          audience: 'wira-app'
        }
      );

      // Reset login attempts on successful login
      await UserModel.resetLoginAttempts(normalizedCode);

      // Remove sensitive data from response
      const safeUser = {
        anonymousCode: user.anonymous_code,
        ngoId: user.ngo_id,
        role: user.role,
        createdAt: user.created_at
      };

      logger.info('Successful login', {
        anonymousCode: normalizedCode,
        ngoId: user.ngo_id,
        role: user.role,
        ip: req.ip
      });

      const response: LoginResponse = {
        success: true,
        token,
        user: safeUser,
        expiresIn: '24h'
      };

      res.json(response);
    } catch (error) {
      logger.error('Database error during login', {
        error: (error as Error).message,
        anonymousCode: normalizedCode
      });
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // New staff login method for email/password authentication
  static async staffLogin(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string };

    logger.info('Staff login attempt', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    try {
      // Validate staff credentials using new method
      const user = await UserModel.validateStaffCredentials(email, password);

      if (!user) {
        logger.warn('Staff login attempt with invalid credentials', {
          email: email,
          ip: req.ip
        });
        res.status(401).json({
          error: 'Email ou senha inválidos'
        });
        return;
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        logger.warn('Staff login attempt on locked account', {
          email: email,
          ip: req.ip
        });
        res.status(401).json({
          error: 'Conta bloqueada. Tente novamente mais tarde.'
        });
        return;
      }

      // Generate JWT token with role information
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET environment variable is not set');
        res.status(500).json({
          error: 'Erro interno do servidor'
        });
        return;
      }

      const token = jwt.sign(
        {
          anonymousCode: user.anonymous_code,
          email: user.email,
          ngoId: user.ngo_id,
          role: user.role,
          sessionId: Math.random().toString(36).substring(2, 15)
        } as JWTayload,
        jwtSecret,
        {
          expiresIn: '24h',
          issuer: 'wira-platform',
          audience: 'wira-dashboard'
        }
      );

      // Update last login
      await UserModel.updateLastLogin(user.anonymous_code);

      // Remove sensitive data from response
      const safeUser = {
        anonymousCode: user.anonymous_code,
        ngoId: user.ngo_id,
        role: user.role,
        createdAt: user.created_at
      };

      // Only include email and realName if they exist
      if (user.email) {
        (safeUser as any).email = user.email;
      }
      if (user.real_name) {
        (safeUser as any).realName = user.real_name;
      }

      logger.info('Successful staff login', {
        email: email,
        role: user.role,
        ngoId: user.ngo_id,
        ip: req.ip
      });

      const response = {
        success: true,
        token,
        user: safeUser,
        expiresIn: '24h'
      } as LoginResponse;

      res.json(response);
    } catch (error) {
      logger.error('Database error during staff login', {
        error: (error as Error).message,
        email: email
      });
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  static async validate(req: Request, res: Response): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        error: 'Token não fornecido'
      });
      return;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET environment variable is not set');
        res.status(500).json({
          error: 'Erro interno do servidor'
        });
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as JWTayload;

      logger.info('Token validation successful', {
        anonymousCode: decoded.anonymousCode,
        sessionId: decoded.sessionId
      });

      res.json({
        success: true,
        valid: true,
        user: {
          anonymousCode: decoded.anonymousCode,
          ngoId: decoded.ngoId
        }
      });
    } catch (error) {
      logger.warn('Invalid token validation attempt', {
        error: (error as Error).message,
        ip: req.ip
      });

      res.status(401).json({
        error: 'Token inválido ou expirado'
      });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        error: 'Token não fornecido'
      });
      return;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET environment variable is not set');
        res.status(401).json({
          error: 'Token inválido'
        });
        return;
      }

      // Verify current token (even if expired)
      const decoded = jwt.verify(token, jwtSecret, {
        ignoreExpiration: true
      }) as JWTayload;

      const role = decoded.role ?? 'VICTIM'
      const audience = typeof decoded.aud === 'string'
        ? decoded.aud
        : role === 'STAFF' || role === 'ADMIN'
          ? 'wira-dashboard'
          : 'wira-app'

      // Generate new token
      const newToken = jwt.sign(
        {
          anonymousCode: decoded.anonymousCode,
          ngoId: decoded.ngoId,
          role,
          ...(decoded.email ? { email: decoded.email } : {}),
          sessionId: Math.random().toString(36).substring(2, 15)
        } as JWTayload,
        jwtSecret,
        {
          expiresIn: '24h',
          issuer: 'wira-platform',
          audience
        }
      );

      logger.info('Token refreshed', {
        anonymousCode: decoded.anonymousCode,
        ip: req.ip
      });

      res.json({
        success: true,
        token: newToken,
        expiresIn: '24h'
      });
    } catch (error) {
      logger.warn('Token refresh failed', {
        error: (error as Error).message,
        ip: req.ip
      });

      res.status(401).json({
        error: 'Token inválido'
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          logger.error('JWT_SECRET environment variable is not set');
          return;
        }

        const decoded = jwt.verify(token, jwtSecret) as JWTayload;

        logger.info('User logout', {
          anonymousCode: decoded.anonymousCode,
          ip: req.ip
        });
      } catch (error) {
        logger.warn('Logout with invalid token', {
          error: (error as Error).message,
          ip: req.ip
        });
      }
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  }

  static async checkAvailability(req: Request, res: Response): Promise<void> {
    const { code } = req.params;
    const normalizedCode = code.toUpperCase();

    // Validate code format
    if (!/^V\d{4}$/i.test(normalizedCode)) {
      res.status(400).json({
        error: 'Código deve estar no formato V####'
      });
      return;
    }

    try {
      const user = await UserModel.findUnique({
        anonymous_code: normalizedCode
      });

      res.json({
        success: true,
        available: !user,
        code: normalizedCode,
        exists: !!user,
        createdAt: user?.created_at ?? null
      });
    } catch (error) {
      logger.error('Database error checking code', {
        error: (error as Error).message,
        code: normalizedCode
      });
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default AuthController;
