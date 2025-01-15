import { Database } from 'better-sqlite3'
import { BaseService } from './base/base-service'
import { IKategori } from '@shared/servisler/referanslar'
import { KategoriStatements, TypeConverter } from '@shared/database'
import { v7 as uuidv7 } from 'uuid'

export class KategoriService extends BaseService<IKategori, KategoriStatements> {
  private static instance: KategoriService
  public serviceName = 'KategoriService'
  protected tableName = 'kategoriler'

  private typeConverters: TypeConverter<IKategori> = {
    id: String,
    is_locked: (v) => Boolean(v),
    locked_by: (v) => (v === null ? '' : String(v)),
    locked_at: (v) => (v === null ? null : new Date(v)),
    updated_at: (v) => (v === null ? null : new Date(v)),
    created_at: (v) => (v === null ? null : new Date(v)),
    computer_name: (v) => String(v),
    user_name: (v) => String(v),
    varsayılan: (v) => Boolean(v),
    kategori: (v) => String(v)
  }

  constructor() {
    super()
  }

  public static getInstance(): KategoriService {
    if (!KategoriService.instance) {
      KategoriService.instance = new KategoriService()
    }
    return KategoriService.instance
  }

  protected initializeStatements(db: Database): void {
    this.statements = {
      getAll: db.prepare(`
        SELECT * FROM ${this.tableName}
        ORDER BY kategori ASC
      `),

      getById: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE id = ?
      `),

      getByKategori: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE kategori = CASE_TURKISH(?)
      `),

      create: db.prepare(`
        INSERT INTO ${this.tableName} (
          id, kategori, varsayılan,
          computer_name, user_name, created_at
        ) VALUES (
          @id, CASE_TURKISH(@kategori), @varsayılan,
          @computer_name, @user_name, @created_at
        )
      `),

      update: db.prepare(`
        UPDATE ${this.tableName}
        SET kategori = CASE_TURKISH(@kategori),
            varsayılan = @varsayılan,
            computer_name = @computer_name,
            user_name = @user_name,
            updated_at = @updated_at
        WHERE id = @id
      `),

      delete: db.prepare(`
        DELETE FROM ${this.tableName}
        WHERE id = ?
      `)
    }
  }

  public async create(data: Partial<IKategori>): Promise<IKategori> {
    this.checkInitialized()

    const entity = {
      id: uuidv7(),
      kategori: data.kategori || '',
      varsayılan: data.varsayılan ? 1 : 0,
      computer_name: this.computerName,
      user_name: this.userName,
      created_at: new Date().toISOString()
    }

    const result = this.runInTransaction(() => {
      this.statements!.create.run(entity)
      const created = this.getById(entity.id)
      if (!created) throw new Error('Kayıt oluşturulamadı')
      return created
    })

    return result
  }

  public async update(id: string, data: Partial<IKategori>): Promise<IKategori> {
    this.checkInitialized()

    const current = await this.getById(id)
    if (!current) throw new Error('Kayıt bulunamadı')

    const entity = {
      id,
      kategori: data.kategori || current.kategori,
      varsayılan:
        data.varsayılan !== undefined ? (data.varsayılan ? 1 : 0) : current.varsayılan ? 1 : 0,
      computer_name: this.computerName,
      user_name: this.userName,
      updated_at: new Date().toISOString()
    }

    const result = this.runInTransaction(() => {
      this.statements!.update.run(entity)
      const updated = this.getById(id)
      if (!updated) throw new Error('Kayıt güncellenemedi')
      return updated
    })

    return result
  }

  public async getByKategori(kategori: string): Promise<IKategori | null> {
    this.checkInitialized()
    const row = this.statements!.getByKategori.get(kategori)
    return row ? this.validateEntity(row, this.typeConverters) : null
  }

  public async getById(id: string): Promise<IKategori> {
    this.checkInitialized()

    const result = this.statements!.getById.get({ id }) as IKategori
    if (!result) throw new Error('Kayıt bulunamadı')

    return this.validateEntity(result, this.typeConverters)
  }

  public async getAll(): Promise<IKategori[]> {
    this.checkInitialized()

    const result = this.statements!.getAll.all() as IKategori[]
    if (!result) throw new Error('Kayıtlar bulunamadı')

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

export const kategoriService = KategoriService.getInstance()
