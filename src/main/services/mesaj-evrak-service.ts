import { Database } from 'better-sqlite3'
import { BaseService } from './base/base-service'
import { IMesajEvrak } from '@shared/servisler/mesaj-evrak'
import { MesajEvrakStatements, TypeConverter } from '@shared/database'
import { v7 as uuidv7 } from 'uuid'
import { ValidationError, DatabaseError } from '@shared/app-error'

export class MesajEvrakService extends BaseService<IMesajEvrak, MesajEvrakStatements> {
  private static instance: MesajEvrakService
  public serviceName = 'MesajEvrakService'
  protected tableName = 'mesaj_evrak'

  private typeConverters: TypeConverter<IMesajEvrak> = {
    id: (v) => String(v),
    is_locked: (v) => Boolean(v),
    locked_by: (v) => String(v),
    locked_at: (v) => (v === null ? null : new Date(v)),
    updated_at: (v) => (v === null ? null : new Date(v)),
    created_at: (v) => (v === null ? null : new Date(v)),
    computer_name: (v) => String(v),
    user_name: (v) => String(v),
    belge_tipi: (v) => v as 'MESAJ' | 'EVRAK',
    belge_cinsi: (v) => v as 'GELEN' | 'GİDEN' | 'TRANSİT',
    gonderen_birlik_id: (v) => String(v),
    belge_kayit_no: (v) => Number(v),
    belge_gün_sira_no: (v) => Number(v),
    belge_no: (v) => String(v),
    belge_konusu: (v) => String(v),
    belge_tarihi: (v) => String(v),
    belge_guv_knt_no: (v) => String(v),
    belge_gizlilik_id: (v) => String(v),
    belge_kategori_id: (v) => String(v),
    belge_klasor_id: (v) => String(v),
    belge_sayfa_sayisi: (v) => Number(v),
    kanal_id: (v) => String(v)
  }

  constructor() {
    super()
  }

  public static getInstance(): MesajEvrakService {
    if (!MesajEvrakService.instance) {
      MesajEvrakService.instance = new MesajEvrakService()
    }
    return MesajEvrakService.instance
  }

  protected initializeStatements(db: Database): void {
    this.statements = {
      create: db.prepare(`
        INSERT INTO ${this.tableName} (
          id, belge_cinsi, kanal_id, belge_kayit_no, belge_gün_sira_no, gonderen_birlik_id, belge_no, belge_konusu, belge_tarihi,
          belge_guv_knt_no, belge_gizlilik_id, belge_kategori_id, belge_klasor_id, 
          belge_sayfa_sayisi, computer_name, user_name, created_at
        ) VALUES (
          @id, @belge_cinsi, @kanal_id, @belge_kayit_no, @belge_gün_sira_no, @gonderen_birlik_id, @belge_no, CASE_TURKISH(@belge_konusu), 
          CASE_TURKISH(@belge_tarihi), @belge_guv_knt_no, @belge_gizlilik_id,
          @belge_kategori_id, @belge_klasor_id, @belge_sayfa_sayisi, @computer_name, @user_name,
          @created_at
        )
      `),
      update: db.prepare(`
        UPDATE ${this.tableName} SET
          belge_cinsi = @belge_cinsi,
          kanal_id = @kanal_id,
          belge_kayit_no = @belge_kayit_no,
          belge_gün_sira_no = @belge_gün_sira_no,
          gonderen_birlik_id = @gonderen_birlik_id,
          belge_no = @belge_no,
          belge_konusu = CASE_TURKISH(@belge_konusu),
          belge_tarihi = CASE_TURKISH(@belge_tarihi),
          belge_guv_knt_no = @belge_guv_knt_no,
          belge_gizlilik_id = @belge_gizlilik_id,
          belge_kategori_id = @belge_kategori_id,
          belge_klasor_id = @belge_klasor_id,
          belge_sayfa_sayisi = @belge_sayfa_sayisi,
          computer_name = @computer_name,
          user_name = @user_name,
          updated_at = @updated_at
        WHERE id = @id
      `),
      delete: db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`),
      getById: db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`),
      getAll: db.prepare(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`),
      getAllWithPagination: db.prepare(`
        SELECT * FROM ${this.tableName}
        ORDER BY created_at DESC
        LIMIT @limit OFFSET @offset
      `),
      getTotalCount: db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`),
      search: db.prepare(`
        SELECT * FROM vw_mesaj_evrak_arama
        WHERE (
          CASE_TURKISH(birlik_adi) LIKE CASE_TURKISH(@keyword) OR
          CASE_TURKISH(belge_konusu) LIKE CASE_TURKISH(@keyword) OR
          CASE_TURKISH(belge_no) LIKE CASE_TURKISH(@keyword) OR
          CASE_TURKISH(belge_kayit_no) LIKE CASE_TURKISH(@keyword)
        )
        ORDER BY created_at DESC
        LIMIT @limit OFFSET @offset
      `),
      getSearchCount: db.prepare(`
        SELECT COUNT(*) as count FROM vw_mesaj_evrak_arama
        WHERE (
          CASE_TURKISH(birlik_adi) LIKE CASE_TURKISH(@keyword) OR
          CASE_TURKISH(belge_konusu) LIKE CASE_TURKISH(@keyword) OR
          CASE_TURKISH(belge_no) LIKE CASE_TURKISH(@keyword) OR
          CASE_TURKISH(belge_kayit_no) LIKE CASE_TURKISH(@keyword)
        )
      `),
      getByDateRange: db.prepare(`
        SELECT * FROM vw_tarih_araligi_helper
        WHERE normalized_belge_tarihi BETWEEN @startDate AND @endDate
        ORDER BY normalized_belge_tarihi DESC
        LIMIT @limit OFFSET @offset
      `),
      getByBelgeTarihi: db.prepare(`
        SELECT * FROM (
          SELECT * FROM vw_evrak_by_belge_tarihi
          UNION ALL
          SELECT * FROM vw_mesaj_by_belge_tarihi
        )
        WHERE belge_tarihi = @date
        ORDER BY created_at DESC
        LIMIT @limit OFFSET @offset
      `),
      getByCreatedAt: db.prepare(`
        SELECT * FROM vw_belgeler_by_created_at
        WHERE created_at BETWEEN @startDate AND @endDate
        ORDER BY created_at DESC
        LIMIT @limit OFFSET @offset
      `),
      getLastDayDocuments: db.prepare(`SELECT * FROM vw_son_24_saat_belgeler`),
      getLastWeekDocuments: db.prepare(`SELECT * FROM vw_son_1_hafta_belgeler`),
      getDocumentStats: db.prepare(`SELECT * FROM vw_belge_istatistikleri`)
    }
  }

  public async create(data: Partial<IMesajEvrak>): Promise<IMesajEvrak> {
    this.checkInitialized()

    if (!data.belge_cinsi) {
      throw new ValidationError('Belge cinsi zorunludur')
    }

    const belgeCinsi = data.belge_cinsi as 'GELEN' | 'GİDEN' | 'TRANSİT'
    if (!['GELEN', 'GİDEN', 'TRANSİT'].includes(belgeCinsi)) {
      throw new ValidationError('Geçersiz belge cinsi')
    }

    return this.runInTransaction(async () => {
      try {
        const entity = {
          id: uuidv7(),
          ...data,
          belge_kayit_no: null,
          belge_gün_sira_no: null,
          computer_name: this.computerName,
          user_name: this.userName,
          created_at: new Date().toISOString()
        }

        await this.statements!.create.run(entity)
        const created = await this.getById(entity.id)
        if (!created) throw new Error('Kayıt oluşturulamadı')
        return this.validateEntity(created, this.typeConverters)
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }
        throw new DatabaseError('Belge oluşturma hatası', 'MEDIUM', error as Error)
      }
    })
  }

  public async update(id: string, data: Partial<IMesajEvrak>): Promise<IMesajEvrak> {
    this.checkInitialized()

    const current = await this.getById(id)
    if (!current) throw new Error('Kayıt bulunamadı')

    const entity = {
      id,
      ...data,
      computer_name: this.computerName,
      user_name: this.userName,
      updated_at: new Date().toISOString()
    }

    const result = this.runInTransaction(async () => {
      await this.statements!.update.run(entity)
      const updated = await this.getById(id)
      if (!updated) throw new Error('Kayıt güncellenemedi')
      return updated
    })

    return this.validateEntity(result, this.typeConverters)
  }

  public async delete(id: string): Promise<void> {
    this.checkInitialized()

    this.runInTransaction(async () => {
      await this.statements!.delete.run(id)
    })
  }

  public async getById(id: string): Promise<IMesajEvrak | null> {
    this.checkInitialized()
    const result = await this.statements!.getById.get(id)
    if (!result) return null
    return this.validateEntity(result, this.typeConverters)
  }

  public async getAllWithPagination(
    page: number = 1,
    pageSize: number = 10
  ): Promise<IMesajEvrak[]> {
    this.checkInitialized()
    const offset = (page - 1) * pageSize
    const result = this.statements!.getAllWithPagination.all({ limit: pageSize, offset })
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getTotalCount(): Promise<number> {
    this.checkInitialized()
    const result = this.statements!.getTotalCount.get()
    if (!result || typeof result !== 'object') return 0
    return 'count' in result ? Number(result.count) : 0
  }

  public async search(
    keyword: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<IMesajEvrak[]> {
    this.checkInitialized()
    const offset = (page - 1) * pageSize
    const result = this.statements!.search.all({
      keyword: `%${keyword}%`,
      limit: pageSize,
      offset
    })
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getSearchCount(keyword: string): Promise<number> {
    this.checkInitialized()
    const result = this.statements!.getSearchCount.get({ keyword: `%${keyword}%` })
    if (!result || typeof result !== 'object') return 0
    return 'count' in result ? Number(result.count) : 0
  }

  public async getByDateRange(
    startDate: Date,
    endDate: Date,
    page: number = 1,
    pageSize: number = 10
  ): Promise<IMesajEvrak[]> {
    this.checkInitialized()
    const offset = (page - 1) * pageSize
    const result = this.statements!.getByDateRange.all({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: pageSize,
      offset
    })
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getByBelgeTarihi(
    date: Date,
    page: number = 1,
    pageSize: number = 10
  ): Promise<IMesajEvrak[]> {
    this.checkInitialized()
    const offset = (page - 1) * pageSize
    const result = this.statements!.getByBelgeTarihi.all({
      date: date.toISOString(),
      limit: pageSize,
      offset
    })
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getByCreatedAt(
    startDate: Date,
    endDate: Date,
    page: number = 1,
    pageSize: number = 10
  ): Promise<IMesajEvrak[]> {
    this.checkInitialized()
    const offset = (page - 1) * pageSize
    const result = this.statements!.getByCreatedAt.all({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: pageSize,
      offset
    })
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getLastDayDocuments(): Promise<IMesajEvrak[]> {
    this.checkInitialized()
    const result = this.statements!.getLastDayDocuments.all()
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getLastWeekDocuments(): Promise<IMesajEvrak[]> {
    this.checkInitialized()
    const result = this.statements!.getLastWeekDocuments.all()
    return result.map((item) => this.validateEntity(item, this.typeConverters))
  }

  public async getDocumentStats() {
    this.checkInitialized()
    const result = this.statements!.getDocumentStats.get()
    return this.validateEntity(result, this.typeConverters)
  }
}

export const mesajEvrakService = MesajEvrakService.getInstance()
