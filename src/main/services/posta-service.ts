import { Database } from 'better-sqlite3'
import { BaseService } from './base/base-service'
import { IPosta } from '@shared/servisler/posta'
import { PostaStatements, TypeConverter } from '@shared/database'
import { v7 as uuidv7 } from 'uuid'

export class PostaService extends BaseService<IPosta, PostaStatements> {
  private static instance: PostaService | null = null
  public serviceName = 'PostaService'
  protected tableName = 'posta'

  private typeConverters: TypeConverter<IPosta> = {
    id: (v) => String(v),
    is_locked: (v) => Boolean(v),
    locked_by: (v) => String(v || ''),
    locked_at: (v) => (v ? new Date(v) : null),
    updated_at: (v) => (v ? new Date(v) : null),
    created_at: (v) => (v ? new Date(v) : null),
    computer_name: (v) => String(v),
    user_name: (v) => String(v),
    mesaj_evrak_id: (v) => String(v),
    birlikler_id: (v) => String(v),
    ust_birlik_id: (v) => String(v),
    posta_durumu: (v) => Boolean(v),
    posta_tarihi: (v) => (v ? new Date(v) : null),
    posta_rr_kodu: (v) => String(v || '')
  }

  private constructor() {
    super()
  }

  public static getInstance(): PostaService {
    if (!PostaService.instance) {
      PostaService.instance = new PostaService()
    }
    return PostaService.instance
  }

  protected initializeStatements(db: Database): void {
    this.statements = {
      getAll: db.prepare(`
        SELECT * FROM ${this.tableName}
        ORDER BY created_at DESC
      `),

      getById: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE id = ?
      `),

      create: db.prepare(`
        INSERT INTO ${this.tableName} (
          id, mesaj_evrak_id, birlikler_id, ust_birlik_id,
          posta_durumu, posta_tarihi, posta_rr_kodu,
          created_at, computer_name, user_name
        ) VALUES (
          @id, @mesajEvrakId, @birlikId, @ustBirlikId,
          @postaDurumu, @postaTarihi, @postaRRKodu,
          datetime('now', 'localtime'), @computerName, @userName
        )
      `),

      update: db.prepare(`
        UPDATE ${this.tableName}
        SET mesaj_evrak_id = @mesajEvrakId,
            birlikler_id = @birlikId,
            ust_birlik_id = @ustBirlikId,
            posta_durumu = @postaDurumu,
            posta_tarihi = @postaTarihi,
            posta_rr_kodu = @postaRRKodu,
            updated_at = datetime('now', 'localtime'),
            computer_name = @computerName,
            user_name = @userName
        WHERE id = @id
      `),

      delete: db.prepare(`
        DELETE FROM ${this.tableName}
        WHERE id = @id
      `),

      getByMesajEvrakId: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE mesaj_evrak_id = ?
      `),

      getByBirlikId: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE birlikler_id = ?
      `),

      updateDurum: db.prepare(`
        UPDATE ${this.tableName}
        SET posta_durumu = @durumu,
            updated_at = datetime('now', 'localtime'),
            computer_name = @computerName,
            user_name = @userName
        WHERE id = @id
      `),

      updateTarih: db.prepare(`
        UPDATE ${this.tableName}
        SET posta_tarihi = @tarihi,
            updated_at = datetime('now', 'localtime'),
            computer_name = @computerName,
            user_name = @userName
        WHERE id = @id
      `),

      updateRRKodu: db.prepare(`
        UPDATE ${this.tableName}
        SET posta_rr_kodu = @rrKodu,
            updated_at = datetime('now', 'localtime'),
            computer_name = @computerName,
            user_name = @userName
        WHERE id = @id
      `)
    }
  }

  public async create(data: Partial<IPosta>): Promise<IPosta> {
    this.checkInitialized()

    const entity = {
      id: uuidv7(),
      ...data,
      posta_durumu: data.posta_durumu ? 1 : 0,
      computer_name: this.computerName,
      user_name: this.userName
    }

    const result = await this.runInTransaction(async () => {
      this.statements!.create.run(entity)
      const created = await this.getById(entity.id)
      if (!created) throw new Error('Kayıt oluşturulamadı')
      return created
    })

    return result
  }

  public async update(id: string, data: Partial<IPosta>): Promise<IPosta> {
    this.checkInitialized()

    const current = await this.getById(id)
    if (!current) throw new Error('Kayıt bulunamadı')

    const entity = {
      ...current,
      posta_durumu: data.posta_durumu ? 1 : 0,
      computer_name: this.computerName,
      user_name: this.userName
    }

    const result = await this.runInTransaction(async () => {
      await this.statements!.update.run(entity)
      const updated = await this.getById(id)
      if (!updated) throw new Error('Kayıt güncellenemedi')
      return updated
    })

    return result
  }

  public async getById(id: string): Promise<IPosta> {
    this.checkInitialized()
    const result = (await this.statements!.getById.get(id)) as IPosta
    if (!result) throw new Error('Kayıt bulunamadı')
    return this.validateEntity(result, this.typeConverters)
  }

  public async getAll(): Promise<IPosta[]> {
    this.checkInitialized()
    const result = (await this.statements!.getAll.all()) as IPosta[]
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getByMesajEvrakId(mesajEvrakId: string): Promise<IPosta[]> {
    this.checkInitialized()
    const result = (await this.statements!.getByMesajEvrakId.all(mesajEvrakId)) as IPosta[]
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getByBirlikId(birlikId: string): Promise<IPosta[]> {
    this.checkInitialized()
    const result = (await this.statements!.getByBirlikId.all(birlikId)) as IPosta[]
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async updateDurum(id: string, durumu: boolean): Promise<boolean> {
    try {
      this.checkInitialized()

      const result = await this.runInTransaction(async () => {
        return await this.statements!.updateDurum.run({
          id,
          durumu: durumu ? 1 : 0,
          computerName: this.computerName,
          userName: this.userName
        })
      })

      return result.changes > 0
    } catch (error) {
      this.handleError('updateDurum', error)
      return false
    }
  }

  public async updateTarih(id: string, tarihi: string): Promise<boolean> {
    try {
      this.checkInitialized()

      const result = await this.runInTransaction(async () => {
        return this.statements!.updateTarih.run({
          id,
          tarihi,
          computerName: this.computerName,
          userName: this.userName
        })
      })

      return result.changes > 0
    } catch (error) {
      this.handleError('updateTarih', error)
      return false
    }
  }

  public async updateRRKodu(id: string, rrKodu: string): Promise<boolean> {
    try {
      this.checkInitialized()

      const result = await this.runInTransaction(async () => {
        return this.statements!.updateRRKodu.run({
          id,
          rrKodu,
          computerName: this.computerName,
          userName: this.userName
        })
      })

      return result.changes > 0
    } catch (error) {
      this.handleError('updateRRKodu', error)
      return false
    }
  }

  public async delete(id: string): Promise<void> {
    this.checkInitialized()

    await this.runInTransaction(async () => {
      const result = await this.statements!.delete.run({ id })
      if (result.changes === 0) {
        throw new Error('Kayıt silinemedi')
      }
    })
  }
}

export const postaService = PostaService.getInstance()
