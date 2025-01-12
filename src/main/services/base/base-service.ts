import * as os from 'os'
import { Database } from 'better-sqlite3'
import { getDatabase } from '../../sql/connection'
import { BaseStatements, TypeConverter } from '@shared/database'
import { ErrorService } from '../error-service'
import { DatabaseError } from '@shared/app-error'
import { IBaseService } from '@shared/servisler/base-servis'
import { ValidationError } from '@shared/app-error'

export abstract class BaseService<T extends IBaseService, TStatements extends BaseStatements> {
  protected initialized = false
  protected statements: TStatements | null = null
  protected db: Database | null = null
  public abstract serviceName: string
  protected abstract tableName: string
  protected computerName: string = os.hostname()
  protected userName: string = os.userInfo().username

  protected abstract initializeStatements(db: Database): void

  public init(): void {
    if (this.initialized) return

    try {
      this.db = getDatabase()
      this.initializeStatements(this.db)
      this.initialized = true
    } catch (error) {
      ErrorService.getInstance().handleError(
        new DatabaseError('Veritabanı başlatma hatası', 'CRITICAL', error as Error)
      )
    }
  }

  public isInitialized(): boolean {
    return this.initialized
  }

  protected checkInitialized(): void {
    if (!this.initialized || !this.statements || !this.db) {
      throw new DatabaseError(`${this.serviceName} henüz başlatılmadı`, 'CRITICAL')
    }
  }

  protected handleError(operation: string, error: unknown) {
    ErrorService.getInstance().handleError(
      new DatabaseError(`${this.serviceName} - ${operation} hatası:`, 'MEDIUM', error as Error)
    )
  }

  /**
   * Bir transaction başlatır
   */
  protected beginTransaction(): void {
    this.checkInitialized()
    this.db!.prepare('BEGIN TRANSACTION').run()
  }

  /**
   * Transaction'ı onaylar
   */
  protected commitTransaction(): void {
    this.checkInitialized()
    this.db!.prepare('COMMIT').run()
  }

  /**
   * Transaction'ı geri alır
   */
  protected rollbackTransaction(): void {
    this.checkInitialized()
    this.db!.prepare('ROLLBACK').run()
  }

  /**
   * Güvenli bir şekilde transaction çalıştırır
   */
  protected async runInTransaction<T>(operation: () => Promise<T>): Promise<T> {
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        this.beginTransaction()
        const result = await operation()
        this.commitTransaction()
        return result
      } catch (error: any) {
        this.rollbackTransaction()

        if (
          (error.code === 'SQLITE_BUSY' || error.code === 'SQLITE_LOCKED') &&
          retryCount < maxRetries - 1
        ) {
          retryCount++
          const waitTime = Math.pow(2, retryCount) * 100
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        }
        this.handleError('runInTransaction', error)
      }
    }
    throw new DatabaseError('Maksimum deneme sayısına ulaşıldı', 'MEDIUM')
  }

  // Kayıt kilitleme
  protected async lockMessage(id: string): Promise<boolean> {
    this.checkInitialized()
    const stmt = this.db!.prepare(`
      UPDATE ${this.tableName} 
      SET is_locked = 1, 
          locked_by = @lockedBy,
          locked_at = CURRENT_TIMESTAMP,
          computer_name = @computerName,
          user_name = @userName
      WHERE id = @id 
      AND (
        is_locked = 0 
        OR 
        (
          is_locked = 1 
          AND locked_at < datetime('now', '-5 minutes')
        )
      )
    `)

    const result = await this.runInTransaction(async () => {
      return stmt.run({
        id,
        lockedBy: `${this.computerName}/${this.userName}`,
        computerName: this.computerName,
        userName: this.userName
      })
    })

    return result.changes > 0
  }

  // Kilit kaldırma
  protected async unlockMessage(id: string): Promise<boolean> {
    this.checkInitialized()
    const stmt = this.db!.prepare(`
      UPDATE ${this.tableName} 
      SET is_locked = 0, 
          locked_by = NULL,
          locked_at = NULL,
          computer_name = @computerName,
          user_name = @userName
      WHERE id = @id 
      AND (
        locked_by = @lockedBy
        OR
        locked_at < datetime('now', '-5 minutes')
      )
    `)

    const result = await this.runInTransaction(async () => {
      return stmt.run({
        id,
        lockedBy: `${this.computerName}/${this.userName}`,
        computerName: this.computerName,
        userName: this.userName
      })
    })

    return result.changes > 0
  }

  /* gelen veriyi tipe çevirme */
  protected validateEntity<T>(row: any, converters: TypeConverter<T>): T {
    try {
      const entity = {} as T
      for (const key in converters) {
        if (row[key] !== undefined) {
          try {
            entity[key] = converters[key](row[key])
          } catch (error) {
            throw new ValidationError(
              `${String(key)} alanı için dönüşüm hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
            )
          }
        }
      }

      return entity
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new ValidationError(
        `Veri dönüşüm hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      )
    }
  }

  public cleanup(): void {
    try {
      this.statements = null
      this.initialized = false
    } catch (error) {
      this.handleError('cleanup', error)
    }
  }

  protected async getById(id: string): Promise<T | null> {
    this.checkInitialized()
    return this.statements!.getById.get(id) as T | null
  }

  protected async getAll(): Promise<T[]> {
    this.checkInitialized()
    return this.statements!.getAll.all() as T[]
  }
}
