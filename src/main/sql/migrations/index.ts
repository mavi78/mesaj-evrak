import { Database } from 'better-sqlite3'
import { getDatabase } from '../connection'
import { v7 as uuidv7 } from 'uuid'
import {
  ERROR_LOGS_SCHEMA,
  LOG_KAYITLARI_SCHEMA,
  GIZLILIK_DERECELERI_SCHEMA,
  KLASORLER_SCHEMA,
  KATEGORILER_SCHEMA,
  BIRLIKLER_SCHEMA,
  MESAJ_EVRAK_SCHEMA,
  KANALLAR_SCHEMA,
  DAGITIM_SCHEMA,
  POSTA_SCHEMA,
  POSTA_TRIGGER
} from './constants'

class MigrationManager {
  private static instance: MigrationManager | null = null
  private db: Database | null = null
  private initialized = false

  public static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager()
    }
    return MigrationManager.instance
  }

  public init(): void {
    if (this.initialized) return
    this.db = getDatabase()

    // Önce özel fonksiyonları tanımla
    this.initializeCustomFunctions()

    // Migrations tablosunu oluştur
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.initialized = true
  }

  /**
   * Özel SQLite fonksiyonlarını tanımlar
   * @private
   */
  private initializeCustomFunctions(): void {
    if (!this.db) return

    // CASE_TURKISH fonksiyonunu tanımla
    this.db.function(
      'CASE_TURKISH',
      {
        deterministic: true,
        varargs: false
      },
      (text: any) => {
        if (!text || typeof text !== 'string') return text
        return text.toLocaleUpperCase('tr-TR')
      }
    )

    // NOCASE_TURKISH fonksiyonunu tanımla
    this.db.function(
      'NOCASE_TURKISH',
      {
        deterministic: true,
        varargs: false
      },
      (text: any) => {
        if (!text || typeof text !== 'string') return text
        return text.toLocaleLowerCase('tr-TR')
      }
    )

    // Yıl bazlı senet no fonksiyonunu tanımla
    this.db.function(
      'fn_get_yil_bazli_senet_no',
      {
        deterministic: true,
        varargs: false
      },
      (yil: number) => {
        const result = this.db!.prepare(
          `
        SELECT COALESCE(
          MAX(senet_no),
          ? * 10000
        ) as son_senet_no
        FROM dagitim 
        WHERE senet_no >= ? * 10000 
        AND senet_no < (? + 1) * 10000
      `
        ).get(yil, yil, yil) as { son_senet_no: number }

        return result.son_senet_no
      }
    )
  }

  private getMigrations(): {
    name: string
    sql: string
  }[] {
    return [
      { name: 'error_logs_schema', sql: ERROR_LOGS_SCHEMA },
      { name: 'gizlilik_dereceleri_schema', sql: GIZLILIK_DERECELERI_SCHEMA },
      { name: 'klasorler_schema', sql: KLASORLER_SCHEMA },
      { name: 'kategoriler_schema', sql: KATEGORILER_SCHEMA },
      { name: 'kanallar_schema', sql: KANALLAR_SCHEMA },
      { name: 'birlikler_schema', sql: BIRLIKLER_SCHEMA },
      { name: 'mesaj_evrak_schema', sql: MESAJ_EVRAK_SCHEMA },
      { name: 'log_kayitlari_schema', sql: LOG_KAYITLARI_SCHEMA },
      { name: 'dagitim_schema', sql: DAGITIM_SCHEMA },
      { name: 'posta_schema', sql: POSTA_SCHEMA },
      { name: 'posta_trigger', sql: POSTA_TRIGGER }
    ]
  }

  public async runMigrations(): Promise<void> {
    if (!this.initialized || !this.db) {
      throw new Error('MigrationManager henüz başlatılmadı')
    }

    const executedMigrations = this.db.prepare('SELECT name FROM migrations').all() as {
      name: string
    }[]
    const executedNames = new Set(executedMigrations.map((m) => m.name))

    try {
      // Tüm migration'lar için tek bir transaction başlat
      this.db.exec('BEGIN IMMEDIATE TRANSACTION')

      // Sırayla migrationları çalıştır
      for (const migration of this.getMigrations()) {
        if (!executedNames.has(migration.name)) {
          try {
            // Migration'ı çalıştır
            this.db.exec(migration.sql as string)

            // Migration kaydını ekle
            this.db
              .prepare('INSERT INTO migrations (id, name) VALUES (?, ?)')
              .run(uuidv7(), migration.name)

            console.info(`Migration başarıyla uygulandı: ${migration.name}`)
          } catch (error) {
            console.error(`Migration hatası (${migration.name}):`, error)
            throw error
          }
        }
      }

      // Tüm migration'lar başarılı olduysa commit yap
      this.db.exec('COMMIT')
      console.info('Migration işlemleri tamamlandı')
    } catch (error) {
      // Herhangi bir hata durumunda tüm değişiklikleri geri al
      if (this.db) {
        this.db.exec('ROLLBACK')
      }
      throw error
    }
  }
}

export const migrationManager = MigrationManager.getInstance()
