import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import * as fs from 'fs/promises'
import { is } from '@electron-toolkit/utils'
import * as path from 'path'

let db: Database.Database | null = null
let dbPath: string | null = null
let isConnected = false

function getDatabasePath(): string {
  let dbDir: string

  if (is.dev) {
    // Development modunda proje dizininde oluştur
    dbDir = path.join(process.cwd(), 'db')
  } else {
    // Production modunda executable'ın bulunduğu dizinde oluştur
    dbDir = path.join(path.dirname(process.execPath), 'db')
  }

  // Dizin yoksa oluştur
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  return path.join(dbDir, 'database.sqlite')
}

async function logStartupError(error: Error): Promise<void> {
  try {
    const logDir = is.dev
      ? path.join(process.cwd(), 'logs')
      : path.join(path.dirname(process.execPath), 'logs')

    await fs.mkdir(logDir, { recursive: true })

    const logFile = path.join(logDir, 'startup-error.log')
    const logEntry = `[${new Date().toISOString()}] ${error.name}: ${error.message}\n${error.stack}\n\n`

    await fs.appendFile(logFile, logEntry, 'utf8')
    console.error('Kritik başlatma hatası loglandı:', error)
  } catch (logError) {
    console.error('Hata loglanırken sorun oluştu:', logError)
  }
}

export const initDatabase = async (): Promise<void> => {
  if (db) return

  try {
    dbPath = getDatabasePath()

    db = new Database(dbPath, {
      verbose: (message) => console.debug('SQLite Query', { query: message }),
      fileMustExist: false,
      timeout: 30000
    })

    // WAL modu ve performans ayarları
    const pragmas = {
      journal_mode: 'WAL', // Write-Ahead Logging - Çoklu okuma/yazma işlemleri için performans artışı sağlar
      busy_timeout: 5000, // Veritabanı meşgul olduğunda beklenecek maksimum süre (milisaniye)
      foreign_keys: 1, // Foreign key kısıtlamalarını aktif eder
      cache_size: -2000, // Veritabanı cache boyutu (negatif değer = kilobayt, pozitif = sayfa sayısı)
      locking_mode: 'EXCLUSIVE', // Veritabanı dosyasını exclusive modda kilitler, başka processlerin erişimini engeller
      case_sensitive_like: 0 // LIKE sorgularında büyük/küçük harf duyarlılığını kapatır
    }

    for (const [key, value] of Object.entries(pragmas)) {
      try {
        db.pragma(`${key} = ${value}`)
        console.debug('SQLite Pragma ayarlandı', { pragma: key, value })
      } catch (error) {
        await logStartupError(error as Error)
      }
    }

    // REGEXP fonksiyonu ekleniyor
    db.function('REGEXP', (pattern: string, text: string) => {
      if (!pattern || !text) return 0
      try {
        const regex = new RegExp(pattern)
        return regex.test(text) ? 1 : 0
      } catch (e) {
        return 0
      }
    })

    db.function('NOCASE_TURKISH', (text: any) => {
      if (!text) return text
      return text.toLocaleLowerCase('tr-TR')
    })

    db.function('CASE_TURKISH', (text: any) => {
      if (!text) return text
      return text.toLocaleUpperCase('tr-TR')
    })

    // Test sorgusu çalıştır
    db.prepare('SELECT 1').get()
    isConnected = true
    console.log('Veritabanı başlatıldı', {
      path: dbPath,
      pragmas: Object.keys(pragmas)
    })
  } catch (error) {
    await logStartupError(error as Error)
    throw error
  }
}

export const getDatabase = (): Database.Database => {
  if (!db) {
    const error = new Error('Veritabanı henüz başlatılmadı')
    logStartupError(error).catch(console.error)
    throw error
  }
  return db
}

export const checkConnection = (): boolean => {
  if (!db || !isConnected) return false

  try {
    db.prepare('SELECT 1').get()
    return true
  } catch (error) {
    isConnected = false
    logStartupError(error as Error).catch(console.error)
    return false
  }
}

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    try {
      db.close()
      db = null
      dbPath = null
    } catch (error) {
      await logStartupError(error as Error)
      throw error
    }
  }
}

export default {
  init: initDatabase,
  get: getDatabase,
  getPath: (): string | null => dbPath,
  close: closeDatabase,
  isConnected: checkConnection
}
