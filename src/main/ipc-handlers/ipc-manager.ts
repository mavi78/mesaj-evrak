import { ErrorService } from '@main/services/error-service'
import { AppError } from '@shared/app-error'
import { ipcMain } from 'electron'
import { MesajEvrakHandler } from './handlers/mesaj-evrak-handler'
import { PostaHandler } from './handlers/posta-handler'
import { DagitimHandler } from './handlers/dagitim-handler'
import { BaseIpcHandler } from './base/base-handler'
import { KanalHandler } from './handlers/kanal-handler'
import { BirlikHandler } from './handlers/birlik-handler'
import { GizlilikDerecesiHandler } from './handlers/gizlilik-derecesi-handler'
import { KategoriHandler } from './handlers/kategori-handler'
import { KlasorHandler } from './handlers/klasor-handler'

export class IpcManager {
  private static instance: IpcManager | null = null
  private handlers: BaseIpcHandler[] = [
    new MesajEvrakHandler(),
    new PostaHandler(),
    new DagitimHandler(),
    new KanalHandler(),
    new BirlikHandler(),
    new GizlilikDerecesiHandler(),
    new KategoriHandler(),
    new KlasorHandler()
  ]

  private constructor() {
    if (IpcManager.instance) {
      throw new Error('IpcManager singleton ihlali')
    }
  }

  public static getInstance(): IpcManager {
    if (!IpcManager.instance) {
      IpcManager.instance = new IpcManager()
    }
    return IpcManager.instance
  }

  public register(): void {
    try {
      for (const handler of this.handlers) {
        handler.register()
      }
    } catch (err) {
      ErrorService.getInstance().handleError(
        new AppError('IPC handler register error', 'IPC_HANDLER_REGISTER_ERROR', 'CRITICAL', {
          error: err
        })
      )
      throw err
    }
  }

  public cleanup(): void {
    try {
      ipcMain.removeAllListeners()
    } catch (err) {
      ErrorService.getInstance().handleError(
        new AppError('IPC handler temizleme hatası', 'IPC_HANDLER_CLEANUP_ERROR', 'CRITICAL', {
          error: err
        })
      )
      throw err
    }
  }
}
