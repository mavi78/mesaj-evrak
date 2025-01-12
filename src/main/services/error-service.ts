import { BrowserWindow, dialog, app } from 'electron'
import { AppError } from '../../shared/app-error'
import { Database } from 'better-sqlite3'
import { getDatabase } from '../sql/connection'
import * as path from 'path'
import * as fs from 'fs/promises'
import { v7 as uuidv7 } from 'uuid'
import * as os from 'os'

interface IErrorLog {
  id: string
  errorType: string
  errorCode: string
  severity: string
  message: string
  stack?: string
  metadata?: string
  computerName: string
  userName: string
  timestamp: string
}

export class ErrorService {
  private static instance: ErrorService | null = null
  private mainWindow?: BrowserWindow
  private db: Database
  private readonly logPath: string
  private readonly maxLogSize: number = 10 * 1024 * 1024 // 10MB
  private readonly retentionDays: number = 30
  private computerName: string
  private userName: string

  private constructor() {
    // Program dizinini al
    const appPath = path.dirname(app.getPath('exe'))
    // Program dizini altında logs klasörü
    this.logPath = path.join(appPath, 'logs')
    this.computerName = os.hostname()
    this.userName = os.userInfo().username
    this.db = getDatabase()
    this.initializeLogDirectory()
    this.initializeDatabase()
  }

  private async initializeLogDirectory(): Promise<void> {
    try {
      // Program dizini altında logs klasörü oluştur
      await fs.mkdir(this.logPath, { recursive: true })
      console.info('Log dizini başarıyla oluşturuldu:', this.logPath)
    } catch (error) {
      console.error('Log dizini oluşturulurken hata:', error)
    }
  }

  private initializeDatabase(): void {
    console.log('Error logs tablosu hazır')
  }

  private getLogFilePath(date: Date): string {
    const fileName = `error-log-${date.toISOString().split('T')[0]}.json`
    return path.join(this.logPath, fileName)
  }

  private async rotateLogFile(): Promise<void> {
    const currentLogFile = this.getLogFilePath(new Date())
    try {
      const stats = await fs.stat(currentLogFile)
      if (stats.size >= this.maxLogSize) {
        const newLogFile = this.getLogFilePath(new Date())
        await fs.rename(currentLogFile, newLogFile)
      }
    } catch (error) {
      console.error('Log dosyası rotate edilemedi:', error)
    }
  }

  private async cleanOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logPath)
      const now = new Date()

      for (const file of files) {
        if (file.startsWith('error-log-') && file.endsWith('.json')) {
          const filePath = path.join(this.logPath, file)
          const stats = await fs.stat(filePath)
          const fileAge = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)

          if (fileAge > this.retentionDays) {
            await fs.unlink(filePath)
            console.info(`Eski log dosyası silindi: ${file}`)
          }
        }
      }
    } catch (err) {
      const error = err as NodeJS.ErrnoException
      console.error('Eski loglar temizlenirken hata:', error.message)
    }
  }

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService()
    }
    return ErrorService.instance
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private async saveErrorLog(errorLog: IErrorLog): Promise<void> {
    // Veritabanına kaydet
    const stmt = this.db.prepare(`
      INSERT INTO error_logs (
        id, error_type, error_code, severity, message,
        stack, metadata, computer_name, user_name, timestamp
      ) VALUES (
        @id, @errorType, @errorCode, @severity, @message,
        @stack, @metadata, @computerName, @userName, @timestamp
      )
    `)

    stmt.run(errorLog)

    // JSON dosyasına kaydet
    const logFile = this.getLogFilePath(new Date())
    try {
      let logs: IErrorLog[] = []

      try {
        const content = await fs.readFile(logFile, 'utf-8')
        logs = JSON.parse(content)
      } catch {
        // Dosya yoksa veya boşsa, yeni array oluştur
      }

      logs.push(errorLog)
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2))
    } catch (error) {
      console.error('Log dosyasına yazılamadı:', error)
    }
  }

  public async handleError(error: Error | AppError): Promise<void> {
    const isAppError = error instanceof AppError
    const errorLog: IErrorLog = {
      id: uuidv7(),
      errorType: error.name,
      errorCode: isAppError ? (error as AppError).code : 'UNKNOWN',
      severity: isAppError ? (error as AppError).severity : 'MEDIUM',
      message: error.message,
      stack: error.stack,
      metadata: isAppError ? JSON.stringify((error as AppError).metadata) : undefined,
      computerName: this.computerName,
      userName: this.userName,
      timestamp: new Date().toISOString()
    }

    // Log kayıtlarını yap
    await this.saveErrorLog(errorLog)
    await this.rotateLogFile()
    await this.cleanOldLogs()

    // Konsola yazdır
    console.error('Application Error:', errorLog)

    // Kritik hatalarda dialog göster
    if (isAppError && (error as AppError).severity === 'CRITICAL') {
      await this.showErrorDialog(error)
    }

    // Main window'a hata bilgisi gönder
    if (this.mainWindow) {
      this.mainWindow.webContents.send('app:onError', {
        type: errorLog.errorType,
        message: errorLog.message,
        severity: errorLog.severity,
        code: errorLog.errorCode,
        metadata: errorLog.metadata ? JSON.parse(errorLog.metadata) : undefined
      })
    }
  }

  private async showErrorDialog(error: Error): Promise<void> {
    if (!this.mainWindow) return

    await dialog.showMessageBox(this.mainWindow, {
      type: 'error',
      title: 'Uygulama Hatası',
      message: error.message,
      detail:
        error instanceof AppError
          ? `Hata Kodu: ${error.code}\nSeverity: ${error.severity}\nMetadata: ${JSON.stringify(error.metadata, null, 2)}`
          : undefined,
      buttons: ['Tamam']
    })
  }

  public async getErrorLogs(filters?: {
    startDate?: Date
    endDate?: Date
    severity?: string
    errorType?: string
  }): Promise<IErrorLog[]> {
    let query = 'SELECT * FROM error_logs WHERE 1=1'
    const params: any = {}

    if (filters?.startDate) {
      query += ' AND timestamp >= @startDate'
      params.startDate = filters.startDate.toISOString()
    }

    if (filters?.endDate) {
      query += ' AND timestamp <= @endDate'
      params.endDate = filters.endDate.toISOString()
    }

    if (filters?.severity) {
      query += ' AND severity = @severity'
      params.severity = filters.severity
    }

    if (filters?.errorType) {
      query += ' AND error_type = @errorType'
      params.errorType = filters.errorType
    }

    query += ' ORDER BY timestamp DESC'

    const stmt = this.db.prepare(query)
    return stmt.all(params) as IErrorLog[]
  }

  public async clearErrorLogs(beforeDate?: Date): Promise<void> {
    if (beforeDate) {
      const stmt = this.db.prepare('DELETE FROM error_logs WHERE timestamp < @beforeDate')
      stmt.run({ beforeDate: beforeDate.toISOString() })
    } else {
      this.db.prepare('DELETE FROM error_logs').run()
    }
  }

  public async getErrorStats(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM error_stats')
    return stmt.all()
  }

  public async getRecentErrors(): Promise<IErrorLog[]> {
    const stmt = this.db.prepare('SELECT * FROM recent_errors')
    return stmt.all() as IErrorLog[]
  }

  public async getErrorsByType(errorType: string): Promise<IErrorLog[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM error_logs WHERE error_type = ? ORDER BY timestamp DESC'
    )
    return stmt.all(errorType) as IErrorLog[]
  }

  public async getErrorsBySeverity(severity: string): Promise<IErrorLog[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM error_logs WHERE severity = ? ORDER BY timestamp DESC'
    )
    return stmt.all(severity) as IErrorLog[]
  }

  public async cleanup(): Promise<void> {
    try {
      // Log dosyalarını rotate et
      await this.rotateLogFiles()

      // Eski logları temizle
      await this.cleanOldLogs()

      // Referansları temizle
      this.mainWindow = undefined
      this.db = null
      ErrorService.instance = null

      console.info('ErrorService başarıyla temizlendi')
    } catch (error: any) {
      console.error('ErrorService temizlenirken hata:', error)
    }
  }

  private async rotateLogFiles(): Promise<void> {
    try {
      const currentLogFile = path.join(this.logPath, 'error-log.json')
      const newLogFile = path.join(
        this.logPath,
        `error-log-${new Date().toISOString().split('T')[0]}.json`
      )

      // Mevcut log dosyası varsa rotate et
      try {
        await fs.access(currentLogFile)
        await fs.rename(currentLogFile, newLogFile)
      } catch (err) {
        const error = err as NodeJS.ErrnoException
        if (error.code !== 'ENOENT') {
          throw error
        }
      }
    } catch (err) {
      const error = err as NodeJS.ErrnoException
      console.error('Log dosyası rotate edilemedi:', error.message)
    }
  }
}
