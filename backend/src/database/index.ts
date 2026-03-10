import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import winston from 'winston'
import encryptionService from '../services/encryption'
import { User, Course, NGO } from '../types'

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs')
}

// Database file path
const DB_PATH = process.env.DATABASE_PATH ?? path.join(__dirname, '../../data/wira.db')

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

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
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/app.log'
    })
  ]
})

// Initialize database connection with security settings
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    logger.error('Database connection error', {
      error: err.message,
      path: DB_PATH
    })
  } else {
    logger.info('Database connected successfully', {
      path: DB_PATH,
      environment: process.env.NODE_ENV
    })
    initializeDatabase()
  }
})

// Enable foreign keys and WAL mode for better performance
db.configure('busyTimeout', 10000)
db.run('PRAGMA foreign_keys = ON')
db.run('PRAGMA journal_mode = WAL')

// Initialize database tables with security considerations
function initializeDatabase(): void {
  logger.info('Initializing database schema')

  // Create users table with encrypted fields
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anonymous_code TEXT UNIQUE NOT NULL,
      real_name TEXT, -- AES-256 encrypted JSON
      phone TEXT, -- AES-256 encrypted JSON
      email TEXT, -- AES-256 encrypted JSON
      ngo_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME,
      is_active BOOLEAN DEFAULT 1,
      login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME
    )
  `, (err) => {
    if (err) {
      logger.error('Error creating users table', { error: err.message })
    } else {
      logger.info('Users table created successfully')
    }
  })

  // Create courses table
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      instructor TEXT,
      duration_hours INTEGER,
      modules_count INTEGER,
      level TEXT,
      skills TEXT, -- JSON array
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      logger.error('Error creating courses table', { error: err.message })
    } else {
      logger.info('Courses table created successfully')
    }
  })

  // Create progress table with enhanced tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_code TEXT,
      course_id TEXT,
      completed_modules TEXT, -- JSON array
      percentage INTEGER DEFAULT 0,
      current_module INTEGER DEFAULT 1,
      quiz_attempts INTEGER DEFAULT 0,
      last_quiz_score INTEGER,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      UNIQUE(user_code, course_id),
      FOREIGN KEY (user_code) REFERENCES users(anonymous_code) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      logger.error('Error creating progress table', { error: err.message })
    } else {
      logger.info('Progress table created successfully')
    }
  })

  // Create certificates table with enhanced security
  db.run(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      anonymous_code TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_title TEXT NOT NULL,
      issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      verification_code TEXT UNIQUE NOT NULL,
      qr_code TEXT NOT NULL,
      instructor TEXT,
      institution TEXT,
      score INTEGER NOT NULL,
      max_score INTEGER DEFAULT 100,
      verified BOOLEAN DEFAULT 0,
      verification_date DATETIME,
      verification_ip TEXT,
      revoked BOOLEAN DEFAULT 0,
      revocation_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (anonymous_code) REFERENCES users(anonymous_code) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      logger.error('Error creating certificates table', { error: err.message })
    } else {
      logger.info('Certificates table created successfully')
    }
  })

  // Create ngos table
  db.run(`
    CREATE TABLE IF NOT EXISTS ngos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      license_number TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      logger.error('Error creating ngos table', { error: err.message })
    } else {
      logger.info('NGOs table created successfully')
    }
  })

  // Create audit log table for security
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_code TEXT,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id TEXT,
      old_values TEXT, -- JSON
      new_values TEXT, -- JSON
      ip_address TEXT,
      user_agent TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_code) REFERENCES users(anonymous_code) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      logger.error('Error creating audit_logs table', { error: err.message })
    } else {
      logger.info('Audit logs table created successfully')
    }
  })

  // Wait a bit for tables to be created, then create indexes
  setTimeout(() => {
    createIndexes()
    // Insert sample data (only in development)
    if (process.env.NODE_ENV === 'development') {
      insertSampleData()
    } else {
      logger.info('Skipping sample data insertion in production')
    }
  }, 1000)
}

// Create database indexes for better performance
function createIndexes(): void {
  const indexes: string[] = [
    'CREATE INDEX IF NOT EXISTS idx_users_anonymous_code ON users(anonymous_code)',
    'CREATE INDEX IF NOT EXISTS idx_users_ngo_id ON users(ngo_id)',
    'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_progress_user_course ON progress(user_code, course_id)',
    'CREATE INDEX IF NOT EXISTS idx_progress_last_activity ON progress(last_activity)',
    'CREATE INDEX IF NOT EXISTS idx_certificates_anonymous_code ON certificates(anonymous_code)',
    'CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_code, timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id)'
  ]

  indexes.forEach((indexSql, i) => {
    db.run(indexSql, (err) => {
      if (err) {
        logger.error(`Error creating index ${i}`, { error: err.message })
      } else {
        logger.debug(`Index ${i} created successfully`)
      }
    })
  })
}

// Secure user insertion with encryption
function insertSecureUser(userData: Partial<User>): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const encryptedData = encryptionService.encryptUserData(userData)

      db.run(`
        INSERT INTO users (anonymous_code, real_name, phone, email, ngo_id, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        encryptedData.anonymous_code,
        encryptedData.real_name,
        encryptedData.phone,
        encryptedData.email,
        encryptedData.ngo_id
      ], function (err) {
        if (err) {
          logger.error('Error inserting user', {
            error: err.message,
            anonymousCode: userData.anonymous_code
          })
          reject(err)
        } else {
          logger.info('User created successfully', {
            id: this.lastID,
            anonymousCode: userData.anonymous_code
          })
          resolve(this.lastID)
        }
      })
    } catch (error) {
      logger.error('Encryption error during user insertion', {
        error: (error as Error).message,
        anonymousCode: userData.anonymous_code
      })
      reject(error)
    }
  })
}

// Audit logging function
function logAudit(
  userCode: string | undefined,
  action: string,
  tableName: string | undefined,
  recordId: string | undefined,
  oldValues: unknown,
  newValues: unknown,
  req: {
    ip?: string;
    get?: (header: string) => string | undefined;
  } | undefined
): void {
  const auditData = {
    user_code: userCode,
    action,
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues ? JSON.stringify(oldValues) : null,
    new_values: newValues ? JSON.stringify(newValues) : null,
    ip_address: req?.ip,
    user_agent: req?.get?.('User-Agent')
  }

  db.run(`
    INSERT INTO audit_logs (user_code, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, Object.values(auditData), (err) => {
    if (err) {
      logger.error('Audit log error', { error: err.message, auditData })
    }
  })
}

// Database query helpers with proper typing
function get <T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row as T || null)
      }
    })
  })
}

function all <T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows as T[])
      }
    })
  })
}

function run(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err)
      } else {
        resolve(this)
      }
    })
  })
}

// Insert sample data for demonstration (development only)
function insertSampleData(): void {
  logger.info('Inserting sample data for development')

  // Insert sample NGOs
  const ngos: NGO[] = [
    {
      id: 'ong-001',
      name: 'Centro de Acolhimento Maputo',
      contact_person: 'Instrutora A',
      phone: '+258 84 123 4567',
      email: 'ana@ongmaputo.org',
      address: 'Av. Eduardo Mondlane, Maputo',
      license_number: 'ONG-MP-001',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'ong-002',
      name: 'Projeto Esperança',
      contact_person: 'Contacto C',
      phone: '+258 84 987 6543',
      email: 'joao@projetoesperanca.org',
      address: 'Rua da Esperança, Matola',
      license_number: 'ONG-MP-002',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ]

  ngos.forEach(ngo => {
    db.run(`
      INSERT OR IGNORE INTO ngos (id, name, contact_person, phone, email, address, license_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [ngo.id, ngo.name, ngo.contact_person, ngo.phone, ngo.email, ngo.address, ngo.license_number])
  })

  // Insert sample users with encryption
  const users: Partial<User>[] = [
    { anonymous_code: 'V0042', ngo_id: 'ong-001', real_name: 'Beneficiária A', phone: '+258 84 111 2222' },
    { anonymous_code: 'V0038', ngo_id: 'ong-001', real_name: 'Instrutora A', phone: '+258 84 333 4444' },
    { anonymous_code: 'V0031', ngo_id: 'ong-002', real_name: 'Beneficiario C', phone: '+258 84 555 6666' }
  ]

  users.forEach(user => {
    try {
      const encryptedData = encryptionService.encryptUserData(user)

      db.run(`
        INSERT OR IGNORE INTO users (anonymous_code, real_name, phone, ngo_id)
        VALUES (?, ?, ?, ?)
      `, [encryptedData.anonymous_code, encryptedData.real_name, encryptedData.phone, encryptedData.ngo_id])

      logger.info('Sample user inserted', { anonymousCode: user.anonymous_code })
    } catch (error) {
      logger.error('Error inserting sample user', {
        error: (error as Error).message,
        anonymousCode: user.anonymous_code
      })
    }
  })

  // Insert sample courses
  const courses: Course[] = [
    {
      id: 'costura',
      title: 'Costura Avançada - Uniformes Escolares',
      description: 'Curso completo de costura industrial focado em produção de uniformes escolares.',
      instructor: 'Professora Instrutora A',
      duration_hours: 40,
      modules_count: 8,
      level: 'Intermediário',
      skills: JSON.stringify(['Máquina industrial', 'Costura reta', 'Acabamentos', 'Controle qualidade']),
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'culinaria',
      title: 'Culinária Profissional Moçambicana',
      description: 'Técnicas de cozinha profissional focadas em pratos moçambicanos.',
      instructor: 'Chef Instrutor',
      duration_hours: 35,
      modules_count: 7,
      level: 'Básico',
      skills: JSON.stringify(['Técnicas de corte', 'Cozinha moçambicana', 'Segurança alimentar', 'Apresentação']),
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'agricultura',
      title: 'Agricultura Sustentável',
      description: 'Técnicas modernas de cultivo de milho e hortaliças.',
      instructor: 'Eng. Instrutora B',
      duration_hours: 30,
      modules_count: 6,
      level: 'Básico',
      skills: JSON.stringify(['Preparação do solo', 'Plantio', 'Irrigação', 'Colheita', 'Armazenamento']),
      is_active: true,
      created_at: new Date().toISOString()
    }
  ]

  courses.forEach(course => {
    db.run(`
      INSERT OR IGNORE INTO courses (id, title, description, instructor, duration_hours, modules_count, level, skills)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [course.id, course.title, course.description, course.instructor, course.duration_hours, course.modules_count, course.level, course.skills])
  })

  logger.info('Sample data insertion completed')

  // Insert sample progress data for demonstration
  insertSampleProgress()
}

// Insert sample progress data for demonstration
function insertSampleProgress(): void {
  logger.info('Inserting sample progress data')

  const sampleProgress = [
    {
      user_code: 'V0042',
      course_id: 'costura',
      completed_modules: JSON.stringify(['mod1', 'mod2', 'mod3']),
      percentage: 37,
      current_module: 4,
      quiz_attempts: 2,
      last_quiz_score: 85,
      last_activity: new Date().toISOString()
    },
    {
      user_code: 'V0042',
      course_id: 'culinaria',
      completed_modules: JSON.stringify([]),
      percentage: 0,
      current_module: 1,
      quiz_attempts: 0,
      last_quiz_score: null,
      last_activity: new Date().toISOString()
    },
    {
      user_code: 'V0038',
      course_id: 'culinaria',
      completed_modules: JSON.stringify(['mod1', 'mod2']),
      percentage: 25,
      current_module: 3,
      quiz_attempts: 1,
      last_quiz_score: 92,
      last_activity: new Date().toISOString()
    },
    {
      user_code: 'V0031',
      course_id: 'agricultura',
      completed_modules: JSON.stringify(['mod1']),
      percentage: 15,
      current_module: 2,
      quiz_attempts: 1,
      last_quiz_score: 78,
      last_activity: new Date().toISOString()
    }
  ]

  sampleProgress.forEach(progress => {
    db.run(`
      INSERT OR REPLACE INTO progress
      (user_code, course_id, completed_modules, percentage, current_module, quiz_attempts, last_quiz_score, last_activity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      progress.user_code,
      progress.course_id,
      progress.completed_modules,
      progress.percentage,
      progress.current_module,
      progress.quiz_attempts,
      progress.last_quiz_score,
      progress.last_activity
    ])
  })

  logger.info('Sample progress data inserted')
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, closing database connection')
  db.close((err) => {
    if (err) {
      logger.error('Error closing database', { error: err.message })
    } else {
      logger.info('Database connection closed')
    }
    process.exit(0)
  })
})

// Export database instance and utilities
export {
  db,
  insertSecureUser,
  logAudit,
  get,
  all,
  run,
  DB_PATH
}

export default db


