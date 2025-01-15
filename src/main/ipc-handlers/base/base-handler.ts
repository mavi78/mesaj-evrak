import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { AppError, DatabaseError } from '@shared/app-error'
import { ErrorService } from '../../services/error-service'

// SQLite hata tipi için interface
interface SQLiteError extends Error {
  code?: string
  errno?: number
  message: string
}

export abstract class BaseIpcHandler {
  protected abstract readonly channel: string

  protected registerHandler<TArgs extends unknown[], TResult>(
    method: string,
    handler: (...args: TArgs) => Promise<TResult> | TResult
  ): void {
    const channelName = `${this.channel}:${method}`

    ipcMain.handle(channelName, async (_event: IpcMainInvokeEvent, ...args: unknown[]) => {
      try {
        const result = await handler(...(args as TArgs))
        return result
      } catch (error: unknown) {
        // SQLite hataları için tip kontrolü ve dönüşüm
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const sqliteError = error as SQLiteError
          if (sqliteError.code?.startsWith('SQLITE_')) {
            console.log(sqliteError.code)
            switch (sqliteError.code) {
              case 'SQLITE_CONSTRAINT_FOREIGNKEY': {
                ErrorService.getInstance().handleError(
                  new DatabaseError('Bağlı veriler var. Önce onları siliniz.', 'MEDIUM', {
                    originalError: sqliteError,
                    sqliteCode: sqliteError.code,
                    sqliteErrno: sqliteError.errno
                  })
                )
                return { success: false }
              }
              case 'SQLITE_CONSTRAINT_UNIQUE': {
                ErrorService.getInstance().handleError(
                  new DatabaseError('Bu kayıt zaten mevcut', 'MEDIUM', {
                    originalError: sqliteError,
                    sqliteCode: sqliteError.code,
                    sqliteErrno: sqliteError.errno
                  })
                )
                return { success: false }
              }
              default: {
                ErrorService.getInstance().handleError(
                  new DatabaseError('Veritabanı işlemi sırasında bir hata oluştu', 'CRITICAL', {
                    originalError: sqliteError,
                    sqliteCode: sqliteError.code,
                    sqliteErrno: sqliteError.errno
                  })
                )
                return { success: false }
              }
            }
          }
        }

        // AppError veya diğer hatalar için
        const appError =
          error instanceof AppError
            ? error
            : new AppError(
                error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu',
                'UNKNOWN_ERROR',
                'MEDIUM',
                { originalError: error }
              )

        await ErrorService.getInstance().handleError(appError)
        return { success: false }
      }
    })
  }

  protected sanitizeArgs(args: unknown[]): unknown[] {
    return args.map((arg) => {
      if (arg instanceof Error) {
        return {
          message: arg.message,
          name: arg.name,
          stack: arg.stack
        }
      }
      return arg
    })
  }

  abstract register(): void
}
