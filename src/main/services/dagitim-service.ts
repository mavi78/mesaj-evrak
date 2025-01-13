import { BaseService } from './base/base-service'
import { DagitimStatements } from '@shared/database'
import { IDagitim } from '@shared/servisler/dagitim'
import { TypeConverter } from '@shared/database'
import { v7 as uuidv7 } from 'uuid'
import { kanalService } from './kanal-service'

/**
 * Dağıtım Servisi View Açıklamaları:
 *
 * 1. v_dagitim_detay:
 *    - Tüm dağıtım kayıtlarının detaylı görünümü
 *    - Mesaj/evrak, birlik ve kanal bilgileri ile birleştirilmiş
 *
 * 2. v_teslim_edilmemis_dagitimlar:
 *    - Üst birlik bazında teslim edilmemiş evrakların özeti
 *    - Bekleyen evrak sayısı ve ID'leri
 *
 * 3. v_ust_birlik_dagitim_detay:
 *    - Üst birlik bazında dağıtım istatistikleri
 *    - Dağıtım sayısı, teslim durumları ve dağıtılan birlikler
 *
 * 4. v_son_senet_no:
 *    - Yıl bazında son senet numaralarını gösterir
 *    - Her yıl için maksimum senet no ve toplam senet adedi
 *
 * 5. v_senet_detay:
 *    - Senet bazında dağıtım detaylarını gösterir
 *    - Evrak sayısı, evrak noları ve teslim edilen birlikler
 */

export class DagitimService extends BaseService<IDagitim, DagitimStatements> {
  private static instance: DagitimService
  public serviceName = 'DagitimService'
  protected tableName = 'dagitim'

  private constructor() {
    super()
  }

  public static getInstance(): DagitimService {
    if (!DagitimService.instance) {
      DagitimService.instance = new DagitimService()
    }
    return DagitimService.instance
  }

  protected typeConverters: TypeConverter<IDagitim> = {
    id: (v) => String(v),
    is_locked: (v) => Boolean(v),
    locked_by: (v) => String(v || ''),
    locked_at: (v) => (v ? new Date(v) : null),
    updated_at: (v) => (v ? new Date(v) : null),
    created_at: (v) => (v ? new Date(v) : null),
    computer_name: (v) => String(v),
    user_name: (v) => String(v),
    birlik_id: (v) => String(v),
    ust_birlik_id: (v) => String(v),
    dagitim_tarihi: (v) => new Date(v),
    mesaj_evrak_id: (v) => String(v),
    kanal_id: (v) => String(v),
    belge_guv_knt_no: (v) => String(v || ''),
    teslim_durumu: (v) => Boolean(v),
    senet_no: (v) => Number(v || 0),
    teslim_tarihi: (v) => (v ? new Date(v) : null)
  }

  protected initializeStatements(): void {
    if (!this.db) throw new Error('Database not initialized')

    this.statements = {
      getAll: this.db.prepare(`
        SELECT * FROM v_dagitim_detay
        ORDER BY dagitim_tarihi DESC
      `),

      getById: this.db.prepare(`
        SELECT * FROM v_dagitim_detay
        WHERE dagitim_id = @id
      `),

      create: this.db.prepare(`
        INSERT INTO dagitim (
          id, is_locked, locked_by, locked_at, created_at,
          computer_name, user_name, birlik_id, ust_birlik_id,
          dagitim_tarihi, mesaj_evrak_id, kanal_id,
          belge_guv_knt_no, teslim_durumu, senet_no, teslim_tarihi
        ) VALUES (
          @id, @is_locked, @locked_by, @locked_at, datetime('now', 'localtime'),
          @computer_name, @user_name, @birlik_id, @ust_birlik_id,
          @dagitim_tarihi, @mesaj_evrak_id, @kanal_id,
          @belge_guv_knt_no, @teslim_durumu, @senet_no, @teslim_tarihi
        )
      `),

      update: this.db.prepare(`
        UPDATE dagitim SET
          is_locked = @is_locked,
          locked_by = @locked_by,
          locked_at = @locked_at,
          updated_at = datetime('now', 'localtime'),
          computer_name = @computer_name,
          user_name = @user_name,
          birlik_id = @birlik_id,
          ust_birlik_id = @ust_birlik_id,
          dagitim_tarihi = @dagitim_tarihi,
          mesaj_evrak_id = @mesaj_evrak_id,
          kanal_id = @kanal_id,
          belge_guv_knt_no = @belge_guv_knt_no,
          teslim_durumu = @teslim_durumu,
          senet_no = @senet_no,
          teslim_tarihi = @teslim_tarihi
        WHERE id = @id
      `),

      delete: this.db.prepare(`
        DELETE FROM dagitim WHERE id = @id
      `),

      getByMesajEvrakId: this.db.prepare(`
        SELECT * FROM v_dagitim_detay
        WHERE mesaj_evrak_id = @mesaj_evrak_id
        ORDER BY dagitim_tarihi DESC
      `),

      getByBirlikId: this.db.prepare(`
        SELECT * FROM v_dagitim_detay
        WHERE birlik_id = @birlik_id OR ust_birlik_id = @birlik_id
        ORDER BY dagitim_tarihi DESC
      `),

      getTeslimEdilmemis: this.db.prepare(`
        SELECT * FROM v_teslim_edilmemis_dagitimlar
        ORDER BY bekleyen_evrak_sayisi DESC
      `),

      getSonSenetNo: this.db.prepare(`
        SELECT son_senet_no
        FROM v_son_senet_no
        WHERE yil = @yil
      `),

      topluSenetGuncelle: this.db.prepare(`
        UPDATE dagitim
        SET senet_no = @senet_no,
            teslim_tarihi = datetime('now', 'localtime'),
            teslim_durumu = 1,
            updated_at = datetime('now', 'localtime')
        WHERE id IN (SELECT value FROM json_each(@dagitim_ids))
      `),

      search: this.db.prepare(`
        SELECT * FROM v_dagitim_detay
        WHERE 
          (belge_no LIKE '%' || @query || '%' OR
           belge_konusu LIKE '%' || @query || '%' OR
           birlik_adi LIKE '%' || @query || '%' OR
           ust_birlik_adi LIKE '%' || @query || '%')
        ORDER BY dagitim_tarihi DESC
        LIMIT @limit OFFSET @offset
      `)
    }
  }

  /**
   * Verilen yıl için en yüksek senet numarasını getirir
   * @param yil - Senet numarası için yıl
   * @returns Yıl bazlı son senet numarası
   */
  async getEnYuksekSenetNo(yil: number): Promise<number> {
    this.checkInitialized()
    const result = this.statements!.getSonSenetNo.get({ yil })
    return result?.son_senet_no || yil * 10000
  }

  /**
   * Seçilen dağıtımlar için toplu senet oluşturur
   * @param dagitimIds - Senet oluşturulacak dağıtım ID'leri
   */
  async topluSenetOlustur(dagitimIds: string[]): Promise<void> {
    this.checkInitialized()
    const yil = new Date().getFullYear()
    const sonSenetNo = await this.getEnYuksekSenetNo(yil)
    const yeniSenetNo = sonSenetNo + 1

    await this.runInTransaction(async () => {
      this.statements!.topluSenetGuncelle.run({
        senet_no: yeniSenetNo,
        dagitim_ids: JSON.stringify(dagitimIds)
      })
    })
  }

  /**
   * Dağıtımın kanal bilgisini günceller
   * @param dagitimId - Güncellenecek dağıtım ID'si
   * @param yeniKanalId - Yeni kanal ID'si
   */
  async kanalGuncelle(dagitimId: string, yeniKanalId: string): Promise<void> {
    this.checkInitialized()
    const dagitim = await this.getById(dagitimId)
    if (!dagitim) throw new Error('Dağıtım bulunamadı')

    dagitim.kanal_id = yeniKanalId
    dagitim.updated_at = new Date()

    await this.runInTransaction(async () => {
      this.statements!.update.run(dagitim)
    })
  }

  /**
   * Yeni bir dağıtım oluşturur
   * @param dagitim - Oluşturulacak dağıtım bilgileri
   */
  async create(dagitim: Omit<IDagitim, 'id'>): Promise<IDagitim> {
    this.checkInitialized()
    const kurye = await kanalService.getKuryeId()
    const yeniDagitim: IDagitim = {
      ...dagitim,
      id: uuidv7(),
      kanal_id: kurye,
      computer_name: this.computerName,
      user_name: this.userName
    }

    await this.runInTransaction(async () => {
      await this.statements!.create.run(yeniDagitim)
    })

    return yeniDagitim
  }

  /**
   * Dağıtım bilgilerini günceller
   * @param dagitim - Güncellenecek dağıtım bilgileri
   */
  async update(dagitim: IDagitim): Promise<void> {
    this.checkInitialized()
    dagitim.computer_name = this.computerName
    dagitim.user_name = this.userName

    await this.runInTransaction(async () => {
      await this.statements!.update.run(dagitim)
    })
  }

  /**
   * Dağıtımı siler
   * @param id - Silinecek dağıtım ID'si
   * @throws {Error} Teslim edilmiş, senet numarası verilmiş veya kilitli dağıtımlar silinemez
   */
  async sil(id: string): Promise<void> {
    this.checkInitialized()
    await this.runInTransaction(async () => {
      const result = await this.statements!.delete.run({ id })
      if (result.changes === 0) {
        throw new Error('Dağıtım bulunamadı veya silinemez durumda')
      }
    })
  }
}

export const dagitimService = DagitimService.getInstance()
