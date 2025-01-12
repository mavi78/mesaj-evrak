import { Database } from 'better-sqlite3'
import { BaseService } from './base/base-service'
import { IKlasor } from '@shared/servisler/referanslar'
import { KlasorStatements, TypeConverter } from '@shared/database'
import { v7 as uuidv7 } from 'uuid'

export class KlasorService extends BaseService<IKlasor, KlasorStatements> {
  private static instance: KlasorService
  public serviceName = 'KlasorService'
  protected tableName = 'klasorler'

  private typeConverters: TypeConverter<IKlasor> = {
    id: (v) => String(v),
    is_locked: (v) => Boolean(v),
    locked_by: (v) => (v === null ? '' : String(v)),
    locked_at: (v) => (v === null ? null : new Date(v)),
    updated_at: (v) => (v === null ? null : new Date(v)),
    created_at: (v) => (v === null ? null : new Date(v)),
    computer_name: (v) => String(v),
    user_name: (v) => String(v),
    varsayılan: (v) => Boolean(v),
    klasor: (v) => String(v)
  }

  constructor() {
    super()
  }

  public static getInstance(): KlasorService {
    if (!KlasorService.instance) {
      KlasorService.instance = new KlasorService()
    }
    return KlasorService.instance
  }

  protected initializeStatements(db: Database): void {
    this.statements = {
      getAll: db.prepare(`
        SELECT * FROM ${this.tableName}
        ORDER BY klasor ASC
      `),

      getById: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE id = ?
      `),

      create: db.prepare(`
        INSERT INTO ${this.tableName} (
          id, klasor, varsayılan,
          computer_name, user_name, created_at
        ) VALUES (
          @id, CASE_TURKISH(@klasor), @varsayılan,
          @computer_name, @user_name, @created_at
        )
      `),

      update: db.prepare(`
        UPDATE ${this.tableName}
        SET klasor = CASE_TURKISH(@klasor),
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

  public async create(data: Partial<IKlasor>): Promise<IKlasor> {
    this.checkInitialized()

    const entity = {
      id: uuidv7(),
      klasor: data.klasor || '',
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

  public async update(id: string, data: Partial<IKlasor>): Promise<IKlasor> {
    this.checkInitialized()

    const current = await this.getById(id)
    if (!current) throw new Error('Kayıt bulunamadı')

    const entity = {
      id,
      klasor: data.klasor || current.klasor,
      varsayılan: data.varsayılan ? 1 : 0,
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

  public async getById(id: string): Promise<IKlasor> {
    this.checkInitialized()

    const result = this.statements!.getById.get({ id }) as IKlasor
    if (!result) throw new Error('Kayıt bulunamadı')

    return this.validateEntity(result, this.typeConverters)
  }

  public async getAll(): Promise<IKlasor[]> {
    this.checkInitialized()

    const result = this.statements!.getAll.all() as IKlasor[]
    if (!result) throw new Error('Kayıtlar bulunamadı')

    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }
}

export const klasorService = KlasorService.getInstance()
