import { BaseService } from './base/base-service'
import { kanallarSchema } from '../sql/schemas/referanslar-schema'
import { Database } from 'better-sqlite3'
import { KanalStatements, TypeConverter } from '@shared/database'
import { v7 as uuidv7 } from 'uuid'
import { DatabaseError } from '@shared/app-error'
import { IKanallar } from '@shared/servisler/referanslar'

export class KanalService extends BaseService<IKanallar, KanalStatements> {
  private static instance: KanalService
  public serviceName = 'KanalService'
  protected tableName = 'kanallar'

  private typeConverters: TypeConverter<IKanallar> = {
    id: (v) => String(v),
    kanal: (v) => String(v),
    computer_name: (v) => String(v),
    user_name: (v) => String(v),
    varsayılan: (v) => Boolean(v),
    is_locked: (v) => Boolean(v),
    is_system: (v) => Boolean(v),
    locked_by: (v) => (v === null ? '' : String(v)),
    locked_at: (v) => (v === null ? null : new Date(v)),
    updated_at: (v) => (v === null ? null : new Date(v)),
    created_at: (v) => (v === null ? null : new Date(v))
  }

  constructor() {
    super()
  }

  public static getInstance(): KanalService {
    if (!KanalService.instance) {
      KanalService.instance = new KanalService()
    }
    return KanalService.instance
  }

  protected initializeStatements(db: Database): void {
    this.statements = {
      getById: db.prepare('SELECT * FROM kanallar WHERE id = ?'),
      getAll: db.prepare('SELECT * FROM kanallar ORDER BY kanal'),
      create: db.prepare(`
        INSERT INTO kanallar (
          id, kanal, is_system, computer_name, user_name, created_at
        ) VALUES (
          @id, 
          CASE_TURKISH(@kanal), 
          @is_system, 
          @computer_name, 
          @user_name,
          @created_at
        )
      `),
      update: db.prepare(`
        UPDATE kanallar 
        SET kanal = CASE_TURKISH(@kanal),
            computer_name = @computer_name,
            user_name = @user_name,
            updated_at = @updated_at
        WHERE id = @id
      `),
      delete: db.prepare('DELETE FROM kanallar WHERE id = ?'),
      getKuryeId: db.prepare("SELECT id FROM kanallar WHERE kanal = 'KURYE'")
    }
  }

  /**
   * Servis başlatıldığında çalışır ve gerekli tabloları oluşturur
   */
  public async initialize(): Promise<void> {
    this.checkInitialized()

    // Şemayı oluştur
    this.db!.exec(kanallarSchema)

    // Sistem kayıtlarını kontrol et ve yoksa ekle
    const sistemKayitlari = [
      { kanal: 'KURYE', is_system: 1 },
      { kanal: 'POSTA', is_system: 1 }
    ]

    await this.runInTransaction(async () => {
      for (const kayit of sistemKayitlari) {
        const mevcutKayit = this.db!.prepare('SELECT id FROM kanallar WHERE kanal = ?').get(
          kayit.kanal
        )

        if (!mevcutKayit) {
          const entity = {
            id: uuidv7(),
            kanal: kayit.kanal,
            is_system: kayit.is_system,
            computer_name: this.computerName,
            user_name: this.userName,
            created_at: new Date().toISOString()
          }
          await this.statements!.create.run(entity)
        }
      }
      return Promise.resolve()
    })
  }

  /**
   * Yeni bir kanal ekler
   */
  async ekle(params: { kanal: string }): Promise<IKanallar> {
    this.checkInitialized()
    const { kanal } = params

    const entity = {
      id: uuidv7(),
      kanal,
      is_system: 0,
      computer_name: this.computerName,
      user_name: this.userName,
      created_at: new Date().toISOString()
    }

    const created = await this.runInTransaction(async () => {
      await this.statements!.create.run(entity)
      return this.validateEntity(await this.getirById(entity.id), this.typeConverters)
    })

    if (!created) throw new DatabaseError('Kanal oluşturulamadı', 'MEDIUM')
    return created
  }

  /**
   * Bir kanalı günceller
   */
  async guncelle(params: { id: string; kanal: string }): Promise<IKanallar> {
    this.checkInitialized()
    const { id, kanal } = params
    const currentKanal = await this.getirById(id)
    if (!currentKanal) throw new DatabaseError('Kanal bulunamadı', 'MEDIUM')

    const entity = {
      id,
      kanal,
      computer_name: this.computerName,
      user_name: this.userName,
      updated_at: new Date().toISOString()
    }

    const updated = await this.runInTransaction(async () => {
      await this.statements!.update.run(entity)
      return this.validateEntity(await this.getirById(entity.id), this.typeConverters)
    })

    if (!updated) throw new DatabaseError('Kanal güncellenemedi', 'MEDIUM')
    return updated
  }

  /**
   * Bir kanalı siler
   */
  async sil(id: string): Promise<{ deleted: boolean }> {
    this.checkInitialized()

    const deleted = await this.runInTransaction(async () => {
      return this.statements!.delete.run(id)
    })

    if (!deleted) throw new DatabaseError('Kanal silinemedi', 'MEDIUM')
    return { deleted: true }
  }

  /**
   * Tüm kanalları getirir
   */
  async getir(): Promise<IKanallar[]> {
    this.checkInitialized()
    const kanallar = await this.statements!.getAll.all()
    return kanallar.map((kanal) => this.validateEntity(kanal, this.typeConverters))
  }

  /**
   * ID'ye göre kanal getirir
   */
  async getirById(id: string): Promise<IKanallar> {
    this.checkInitialized()
    const kanal = await this.statements!.getById.get(id)
    if (!kanal) throw new DatabaseError('Kanal bulunamadı', 'MEDIUM')
    return this.validateEntity(kanal, this.typeConverters)
  }

  public async getKuryeId(): Promise<string> {
    this.checkInitialized()
    const kurye = await this.statements!.getKuryeId.get()
    if (!kurye) throw new DatabaseError('Kurye bulunamadı', 'MEDIUM')
    return kurye.id
  }
}
export const kanalService = KanalService.getInstance()
