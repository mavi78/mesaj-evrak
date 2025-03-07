import { ServiceType, BaseServiceInstance } from '@shared/servisler/servis-manager'
import { Database } from 'better-sqlite3'
import { klasorService } from './klasor-service'
import { AppError } from '@shared/app-error'
import { gizlilikDerecesiService } from './gizlilik-derecesi-service'
import { kategoriService } from './kategori-service'
import { birlikService } from './birlik-service'
import { ErrorService } from './error-service'
import { BrowserWindow } from 'electron'
import { mesajEvrakService } from './mesaj-evrak-service'
import { kanalService } from './kanal-service'
import { dagitimService } from './dagitim-service'
import { postaService } from './posta-service'

export class ServiceManager {
  private static instance: ServiceManager | null = null
  private initialized = false
  private db: Database | null = null
  private mainWindow: BrowserWindow | null = null

  // Servislerin başlatılma sırası önemli
  private serviceOrder: (keyof ServiceType)[] = [
    'gizlilikDerecesi', // Önce referans tabloları
    'kategori',
    'klasor',
    'kanal',
    'birlik', // Sonra sayaç servisi
    'mesajEvrak', // En son mesaj_evrak tablosu
    'dagitim',
    'posta'
  ]

  private services: { [K in keyof ServiceType]: BaseServiceInstance } = {
    klasor: klasorService,
    gizlilikDerecesi: gizlilikDerecesiService,
    kanal: kanalService,
    kategori: kategoriService,
    birlik: birlikService,
    mesajEvrak: mesajEvrakService,
    dagitim: dagitimService,
    posta: postaService
  }

  private constructor() {
    if (ServiceManager.instance) {
      throw new AppError('ServiceManager singleton ihlali', 'SINGLETON_ERROR', 'CRITICAL')
    }
  }

  public static async getInstance(): Promise<ServiceManager> {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager()
    }
    return ServiceManager.instance
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
    if (this.initialized) {
      ErrorService.getInstance().setMainWindow(window)
    }
  }

  public async init(db: Database): Promise<void> {
    this.db = db
    try {
      if (this.initialized) return

      // ErrorService'i başlat
      const errorService = ErrorService.getInstance()
      if (this.mainWindow) {
        errorService.setMainWindow(this.mainWindow)
      }

      // Servisleri sırayla başlat
      for (const serviceName of this.serviceOrder) {
        const service = this.services[serviceName]
        try {
          await service.init(db)
          console.log(`${service.serviceName} başarıyla başlatıldı`)
        } catch (err) {
          throw new AppError(
            `${service.serviceName} başlatılırken bir hata oluştu`,
            (err as Error).name,
            'CRITICAL',
            err as Error
          )
        }
      }

      this.initialized = true
      kanalService.initialize()
      console.log('Tüm servisler başarıyla başlatıldı')
    } catch (err) {
      this.initialized = false
      throw new AppError(
        'ServiceManager init hatası',
        (err as Error).name,
        'CRITICAL',
        err as Error
      )
    }
  }

  public getService<K extends keyof ServiceType>(name: K): ServiceType[K] {
    if (!this.initialized) {
      throw new AppError(
        'ServiceManager henüz başlatılmadı',
        'SERVICE_MANAGER_NOT_INITIALIZED',
        'CRITICAL'
      )
    }
    return this.services[name] as ServiceType[K]
  }

  public async cleanup(): Promise<void> {
    try {
      if (!this.initialized) return

      // ErrorService'i en son temizle
      const errorService = ErrorService.getInstance()

      // Önce diğer servisleri temizle
      for (const service of Object.values(this.services)) {
        service.cleanup()
      }

      // ErrorService'i temizle
      await errorService.cleanup()

      if (this.db) {
        this.db.close()
        this.db = null
      }

      this.initialized = false
      ServiceManager.instance = null
      this.mainWindow = null
    } catch (error) {
      throw new AppError(
        'ServiceManager cleanup hatası',
        (error as Error).name,
        'CRITICAL',
        error as Error
      )
    }
  }

  public isInitialized(): boolean {
    return this.initialized
  }

  public getDatabase(): Database {
    if (!this.db) {
      throw new AppError('Veritabanı henüz başlatılmadı', 'DATABASE_NOT_INITIALIZED', 'CRITICAL')
    }
    return this.db
  }
}

export const serviceManager = ServiceManager.getInstance()
