import { Database } from 'better-sqlite3'
import { BaseService } from './base/base-service'
import { IBirlikler } from '@shared/servisler/birlikler'
import { BirlikStatements, TypeConverter } from '@shared/database'
import { v7 as uuidv7 } from 'uuid'

export class BirlikService extends BaseService<IBirlikler, BirlikStatements> {
  private static instance: BirlikService
  public serviceName = 'BirlikService'
  protected tableName = 'birlikler'

  private typeConverters: TypeConverter<IBirlikler> = {
    id: (v) => String(v),
    is_locked: (v) => Boolean(v),
    locked_by: (v) => String(v),
    locked_at: (v) => (v === null ? null : new Date(v)),
    updated_at: (v) => (v === null ? null : new Date(v)),
    created_at: (v) => (v === null ? null : new Date(v)),
    computer_name: (v) => String(v),
    user_name: (v) => String(v),
    birlik_adi: (v) => String(v),
    birlik_tanitim_kodu: (v) => String(v),
    birlik_tipi: (v) => v as 'KOMUTANLIK' | 'BİRLİK' | 'ŞUBE',
    ust_birlik_id: (v) => String(v)
  }

  constructor() {
    super()
  }

  public static getInstance(): BirlikService {
    if (!BirlikService.instance) {
      BirlikService.instance = new BirlikService()
    }
    return BirlikService.instance
  }

  protected initializeStatements(db: Database): void {
    this.statements = {
      getAll: db.prepare(`
        SELECT * FROM ${this.tableName}
        ORDER BY birlik_adi ASC
      `),

      getById: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE id = ?
      `),

      getByParentId: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE ust_birlik_id = ?
        ORDER BY birlik_adi ASC
      `),

      create: db.prepare(`
        INSERT INTO ${this.tableName} (
          id, birlik_adi, birlik_tanitim_kodu, birlik_tipi, ust_birlik_id,
          computer_name, user_name, created_at
        ) VALUES (
          @id, CASE_TURKISH(@birlik_adi), @birlik_tanitim_kodu, @birlik_tipi, @ust_birlik_id,
          @computer_name, @user_name, datetime('now', 'localtime')
        )
      `),

      update: db.prepare(`
        UPDATE ${this.tableName}
        SET birlik_adi = CASE_TURKISH(@birlik_adi),
            birlik_tanitim_kodu = @birlik_tanitim_kodu,
            birlik_tipi = @birlik_tipi,
            ust_birlik_id = @ust_birlik_id,
            computer_name = @computer_name,
            user_name = @user_name,
            updated_at = datetime('now', 'localtime')
        WHERE id = @id
      `),

      delete: db.prepare(`
        DELETE FROM ${this.tableName}
        WHERE id = ?
      `)
    }
  }

  public async create(data: Partial<IBirlikler>): Promise<IBirlikler> {
    this.checkInitialized()

    const entity = {
      id: uuidv7(),
      birlik_adi: data.birlik_adi || '',
      birlik_tanitim_kodu: data.birlik_tanitim_kodu || '',
      birlik_tipi: data.birlik_tipi || 'BİRLİK',
      ust_birlik_id: data.ust_birlik_id || null,
      computer_name: this.computerName,
      user_name: this.userName
    }

    const result = this.runInTransaction(() => {
      this.statements!.create.run(entity)
      const created = this.getById(entity.id)
      if (!created) throw new Error('Kayıt oluşturulamadı')
      return created
    })

    return result
  }

  public async update(id: string, data: Partial<IBirlikler>): Promise<IBirlikler> {
    this.checkInitialized()

    const current = await this.getById(id)
    if (!current) throw new Error('Kayıt bulunamadı')

    const entity = {
      id,
      birlik_adi: data.birlik_adi || current.birlik_adi,
      birlik_tanitim_kodu: data.birlik_tanitim_kodu || current.birlik_tanitim_kodu,
      birlik_tipi: data.birlik_tipi || current.birlik_tipi,
      ust_birlik_id: data.ust_birlik_id !== undefined ? data.ust_birlik_id : current.ust_birlik_id,
      computer_name: this.computerName,
      user_name: this.userName
    }

    const result = this.runInTransaction(() => {
      this.statements!.update.run(entity)
      const updated = this.getById(id)
      if (!updated) throw new Error('Kayıt güncellenemedi')
      return updated
    })

    return result
  }

  public async getById(id: string): Promise<IBirlikler> {
    this.checkInitialized()

    const result = this.statements!.getById.get({ id }) as IBirlikler
    if (!result) throw new Error('Kayıt bulunamadı')

    return this.validateEntity(result, this.typeConverters)
  }

  public async getAll(): Promise<IBirlikler[]> {
    this.checkInitialized()

    const result = this.statements!.getAll.all() as IBirlikler[]
    if (!result) throw new Error('Kayıtlar bulunamadı')

    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getByParentId(parentId: string): Promise<IBirlikler[]> {
    this.checkInitialized()

    const result = this.statements!.getByParentId.get({ parentId }) as IBirlikler[]
    if (!result) return []

    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async delete(id: string): Promise<void> {
    this.checkInitialized()
    await this.runInTransaction(async () => {
      const result = await this.statements!.delete.run(id)
      if (result.changes === 0) {
        throw new Error('Kayıt silinemedi')
      }
    })
  }
}

export const birlikService = BirlikService.getInstance()
