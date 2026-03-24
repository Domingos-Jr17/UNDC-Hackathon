import prismaService from '../services/prisma';
import encryptionService from '../services/encryption';
import { User as UserInterface } from '../types';

const prisma = prismaService.getClient();

const toUser = (user: {
  id: number
  anonymous_code: string
  real_name: string | null
  phone: string | null
  email: string | null
  password: string | null
  date_of_birth: Date | null
  initial_skills: string | null
  location: string | null
  ngo_id: string | null
  role: 'VICTIM' | 'STAFF' | 'ADMIN'
  email_verified: boolean
  created_at: Date
  updated_at: Date | null
  last_login_at: Date | null
  is_active: boolean
  login_attempts: number
  locked_until: Date | null
}): UserInterface => ({
  id: user.id,
  anonymous_code: user.anonymous_code,
  ngo_id: user.ngo_id,
  role: user.role,
  email_verified: user.email_verified,
  created_at: user.created_at.toISOString(),
  is_active: user.is_active,
  login_attempts: user.login_attempts,
  ...(user.real_name ? { real_name: user.real_name } : {}),
  ...(user.phone ? { phone: user.phone } : {}),
  ...(user.email ? { email: user.email } : {}),
  ...(user.password ? { password: user.password } : {}),
  ...(user.date_of_birth ? { date_of_birth: user.date_of_birth.toISOString() } : {}),
  ...(user.initial_skills ? { initial_skills: user.initial_skills } : {}),
  ...(user.location ? { location: user.location } : {}),
  ...(user.updated_at ? { updated_at: user.updated_at.toISOString() } : {}),
  ...(user.last_login_at ? { last_login_at: user.last_login_at.toISOString() } : {}),
  ...(user.locked_until ? { locked_until: user.locked_until.toISOString() } : {})
})

class UserModel {
  static async findByAnonymousCode(anonymousCode: string): Promise<UserInterface | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { anonymous_code: anonymousCode }
      });

      if (!user) return null;

      return toUser(user);
    } catch (error) {
      throw error;
    }
  }

  static async create(userData: Partial<UserInterface>): Promise<number> {
    try {
      // Criptografar apenas os campos sensíveis
      const encryptedUserData = encryptionService.encryptUserData(userData);

      const user = await prisma.user.create({
        data: {
          anonymous_code: encryptedUserData.anonymous_code as string,
          real_name: encryptedUserData.real_name || null,
          phone: encryptedUserData.phone || null,
          email: encryptedUserData.email || null,
          date_of_birth: userData.date_of_birth ? new Date(userData.date_of_birth) : null,
          initial_skills: userData.initial_skills || null,
          location: userData.location || null,
          ngo_id: userData.ngo_id!,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      return user.id;
    } catch (error) {
      throw error;
    }
  }

  static async updateLoginAttempt(anonymousCode: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { anonymous_code: anonymousCode },
        data: {
          login_attempts: { increment: 1 },
          last_login_at: new Date()
        }
      });
    } catch (error) {
      throw error;
    }
  }

  static async resetLoginAttempts(anonymousCode: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { anonymous_code: anonymousCode },
        data: {
          login_attempts: 0,
          locked_until: null
        }
      });
    } catch (error) {
      throw error;
    }
  }

  static async lockAccount(anonymousCode: string, until: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { anonymous_code: anonymousCode },
        data: {
          locked_until: new Date(until)
        }
      });
    } catch (error) {
      throw error;
    }
  }

  static async validateCredentials(anonymousCode: string): Promise<UserInterface | null> {
    return await this.findByAnonymousCode(anonymousCode);
  }

  // New methods for staff email/password authentication
  static async findByEmail(email: string): Promise<UserInterface | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          email: email,
          is_active: true,
          role: { in: ['STAFF', 'ADMIN'] }
        }
      });

      if (!user) return null;

      return toUser(user);
    } catch (error) {
      throw error;
    }
  }

  static async validateStaffCredentials(email: string, password: string): Promise<UserInterface | null> {
    try {
      const user = await this.findByEmail(email);
      if (!user || !user.password) {
        return null;
      }

      // Verify password using bcrypt
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return null;
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async updateLastLogin(anonymousCode: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { anonymous_code: anonymousCode },
        data: { last_login_at: new Date() }
      });
    } catch (error) {
      throw error;
    }
  }

  // New ORM-like methods using Prisma
  static async findUnique(where: { anonymous_code: string }): Promise<UserInterface | null> {
    try {
      const user = await prisma.user.findUnique({
        where
      });

      if (!user) return null;

      return toUser(user);
    } catch (error) {
      throw error;
    }
  }

  static async findMany(): Promise<UserInterface[]> {
    try {
      const users = await prisma.user.findMany({
        where: { is_active: true }
      });

      return users.map((user: any) => toUser(user));
    } catch (error) {
      throw error;
    }
  }

  static async update(
    where: { anonymous_code: string },
    data: Partial<UserInterface>
  ): Promise<UserInterface | null> {
    try {
      // Remove fields that shouldn't be updated directly
      const updateData: any = { ...data };
      delete updateData.id;
      delete updateData.anonymous_code;
      delete updateData.created_at;

      // Add updated timestamp
      updateData.updated_at = new Date();
      if (updateData.date_of_birth) {
        updateData.date_of_birth = new Date(updateData.date_of_birth);
      }

      const user = await prisma.user.update({
        where,
        data: updateData
      });

      return toUser(user);
    } catch (error) {
      throw error;
    }
  }

  static async delete(where: { anonymous_code: string }): Promise<void> {
    try {
      await prisma.user.delete({
        where
      });
    } catch (error) {
      throw error;
    }
  }
}

export default UserModel;
