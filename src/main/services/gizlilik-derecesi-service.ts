import { Database } from 'better-sqlite3'
import { BaseService } from './base/base-service'
import { IGizlilikDerecesi } from '@shared/servisler/referanslar'
import { GizlilikDerecesiStatements, TypeConverter } from '@shared/database'
import { v7 as uuidv7 } from 'uuid'

export class GizlilikDerecesiService extends BaseService<
  IGizlilikDerecesi,
  GizlilikDerecesiStatements
> {
  private static instance: GizlilikDerecesiService
  public serviceName = 'GizlilikDerecesiService'
  protected tableName = 'gizlilik_dereceleri'

  private typeConverters: TypeConverter<IGizlilikDerecesi> = {
    id: (v) => String(v),
    is_locked: (v) => Boolean(v),
    locked_by: (v) => String(v),
    locked_at: (v) => (v === null ? null : new Date(v)),
    updated_at: (v) => (v === null ? null : new Date(v)),
    created_at: (v) => (v === null ? null : new Date(v)),
    computer_name: (v) => String(v),
    user_name: (v) => String(v),
    varsayılan: (v) => Boolean(v),
    gizlilik_derecesi: (v) => String(v),
    guvenlik_kodu_gereklimi: (v) => Boolean(v)
  }

  constructor() {
    super()
  }

  public static getInstance(): GizlilikDerecesiService {
    if (!GizlilikDerecesiService.instance) {
      GizlilikDerecesiService.instance = new GizlilikDerecesiService()
    }
    return GizlilikDerecesiService.instance
  }

  protected initializeStatements(db: Database): void {
    this.statements = {
      getAll: db.prepare(`
        SELECT * FROM ${this.tableName}
        ORDER BY gizlilik_derecesi ASC
      `),

      getById: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE id = ?
      `),

      create: db.prepare(`
        INSERT INTO ${this.tableName} (
          id, gizlilik_derecesi, guvenlik_kodu_gereklimi, varsayılan,
          computer_name, user_name, created_at
        ) VALUES (
          @id, CASE_TURKISH(@gizlilik_derecesi), @guvenlik_kodu_gereklimi, @varsayılan,
          @computer_name, @user_name, @created_at
        )
      `),

      update: db.prepare(`
        UPDATE ${this.tableName}
        SET gizlilik_derecesi = CASE_TURKISH(@gizlilik_derecesi),
            guvenlik_kodu_gereklimi = @guvenlik_kodu_gereklimi,
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

  public async create(data: Partial<IGizlilikDerecesi>): Promise<IGizlilikDerecesi> {
    this.checkInitialized()

    const entity = {
      id: uuidv7(),
      gizlilik_derecesi: data.gizlilik_derecesi || '',
      guvenlik_kodu_gereklimi: data.guvenlik_kodu_gereklimi ? 1 : 0,
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

  public async update(id: string, data: Partial<IGizlilikDerecesi>): Promise<IGizlilikDerecesi> {
    this.checkInitialized()

    const current = await this.getById(id)
    if (!current) throw new Error('Kayıt bulunamadı')

    const entity = {
      id,
      gizlilik_derecesi: data.gizlilik_derecesi || current.gizlilik_derecesi,
      varsayılan:
        data.varsayılan !== undefined ? (data.varsayılan ? 1 : 0) : current.varsayılan ? 1 : 0,
      guvenlik_kodu_gereklimi:
        data.guvenlik_kodu_gereklimi !== undefined
          ? data.guvenlik_kodu_gereklimi
            ? 1
            : 0
          : current.guvenlik_kodu_gereklimi
            ? 1
            : 0,
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

  public async getById(id: string): Promise<IGizlilikDerecesi> {
    this.checkInitialized()

    const result = this.statements!.getById.get({ id }) as IGizlilikDerecesi
    if (!result) throw new Error('Kayıt bulunamadı')

    return this.validateEntity(result, this.typeConverters)
  }

  public async getAll(): Promise<IGizlilikDerecesi[]> {
    this.checkInitialized()

    const result = this.statements!.getAll.all() as IGizlilikDerecesi[]
    if (!result) throw new Error('Kayıtlar bulunamadı')

    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }
}

export const gizlilikDerecesiService = GizlilikDerecesiService.getInstance()
