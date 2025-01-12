import { Database } from 'better-sqlite3'
import { BaseService } from './base/base-service'
import { ISayac, ISayacNumaralari } from '@shared/servisler/sayac'
import { SayacStatements, TypeConverter } from '@shared/database'
import { v7 as uuidv7 } from 'uuid'
import { format } from 'date-fns'

export class SayacService extends BaseService<ISayac, SayacStatements> {
  private static instance: SayacService
  public serviceName = 'SayacService'
  protected tableName = 'sayac'

  private typeConverters: TypeConverter<ISayac> = {
    id: (v) => String(v),
    is_locked: (v) => Boolean(v),
    locked_by: (v) => String(v),
    locked_at: (v) => (v === null ? null : new Date(v)),
    updated_at: (v) => (v === null ? null : new Date(v)),
    created_at: (v) => (v === null ? null : new Date(v)),
    computer_name: (v) => String(v),
    user_name: (v) => String(v),
    belge_cinsi: (v) => v as 'GELEN' | 'GİDEN' | 'TRANSİT',
    yil: (v) => String(v),
    son_kayit_no: (v) => Number(v),
    gun: (v) => String(v),
    son_gun_sira_no: (v) => Number(v)
  }

  constructor() {
    super()
  }

  public static getInstance(): SayacService {
    if (!SayacService.instance) {
      SayacService.instance = new SayacService()
    }
    return SayacService.instance
  }

  protected initializeStatements(db: Database): void {
    this.statements = {
      getAll: db.prepare(`
        SELECT * FROM ${this.tableName}
        ORDER BY yil DESC, gun DESC
      `),

      getById: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE id = ?
      `),

      getBelgeCinsiAndTarih: db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE belge_cinsi = @belge_cinsi
        AND yil = @yil
        AND gun = @gun
      `),

      create: db.prepare(`
        INSERT INTO ${this.tableName} (
          id, belge_cinsi, yil, gun,
          computer_name, user_name, created_at
        ) VALUES (
          @id, @belge_cinsi, @yil, @gun,
          @computerName, @userName, @created_at
        )
      `),

      update: db.prepare(`
        UPDATE ${this.tableName}
        SET computer_name = @computerName,
            user_name = @userName,
            updated_at = @updated_at
        WHERE id = @id
      `),

      delete: db.prepare(`
        DELETE FROM ${this.tableName}
        WHERE id = ?
      `),

      artirSayac: db.prepare(`
        UPDATE ${this.tableName}
        SET son_islem = datetime('now')
        WHERE id = @id
      `),

      getSayacIstatistikleri: db.prepare(`
        SELECT * FROM vw_sayac_istatistikleri
      `)
    }
  }

  public async getBelgeNumaralari(
    belge_cinsi: string,
    kayit_tarihi: string
  ): Promise<ISayacNumaralari> {
    this.checkInitialized()

    const tarih = new Date(kayit_tarihi)
    const yil = format(tarih, 'yyyy')
    const gun = format(tarih, 'yyyy-MM-dd')

    return this.runInTransaction(async () => {
      // Sayaç kaydını al veya oluştur
      let sayac = await this.getBelgeCinsiAndTarih(belge_cinsi, yil, gun)
      if (!sayac) {
        sayac = await this.create({
          belge_cinsi: belge_cinsi as 'GELEN' | 'GİDEN' | 'TRANSİT',
          yil,
          gun
        })
      } else {
        // Sayacı artır
        await this.statements!.artirSayac.run({ id: sayac.id })
        sayac = await this.getById(sayac.id)
      }

      return {
        kayit_no: sayac.son_kayit_no,
        gun_sira_no: sayac.son_gun_sira_no
      }
    })
  }

  private async getBelgeCinsiAndTarih(
    belge_cinsi: string,
    yil: string,
    gun: string
  ): Promise<ISayac | null> {
    const result = (await this.statements!.getBelgeCinsiAndTarih.get({
      belge_cinsi,
      yil,
      gun
    })) as ISayac | null
    if (!result) return null
    return this.validateEntity(result, this.typeConverters)
  }

  public async create(data: Partial<ISayac>): Promise<ISayac> {
    this.checkInitialized()

    const entity = {
      ...data,
      id: uuidv7(),
      computer_name: this.computerName,
      user_name: this.userName,
      created_at: new Date().toISOString()
    }

    const result = await this.runInTransaction(async () => {
      await this.statements!.create.run(entity)
      const created = await this.getById(entity.id)
      if (!created) throw new Error('Kayıt oluşturulamadı')
      return created
    })

    return result
  }

  public async update(id: string, data: Partial<ISayac>): Promise<ISayac> {
    this.checkInitialized()

    const current = await this.getById(id)
    if (!current) throw new Error('Kayıt bulunamadı')

    const entity = {
      ...data,
      computer_name: this.computerName,
      user_name: this.userName,
      updated_at: new Date().toISOString()
    }

    const result = await this.runInTransaction(async () => {
      await this.statements!.update.run(entity)
      const updated = await this.getById(id)
      if (!updated) throw new Error('Kayıt güncellenemedi')
      return updated
    })

    return result
  }

  public async getSayacIstatistikleri(): Promise<ISayac[]> {
    this.checkInitialized()
    const result = (await this.statements!.getSayacIstatistikleri.all()) as ISayac[]
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  protected async getById(id: string): Promise<ISayac> {
    this.checkInitialized()
    const result = (await this.statements!.getById.get(id)) as ISayac | null
    if (!result) throw new Error('Kayıt bulunamadı')
    return this.validateEntity(result, this.typeConverters)
  }
}

export const sayacService = SayacService.getInstance()
