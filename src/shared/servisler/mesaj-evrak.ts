import { IBaseService } from './base-servis'

export interface IMesajEvrak extends IBaseService {
  belge_tipi: 'MESAJ' | 'EVRAK'
  belge_cinsi: 'GELEN' | 'GİDEN' | 'TRANSİT'
  kanal_id: string
  gonderen_birlik_id: string
  belge_kayit_no: number
  belge_gün_sira_no: number
  belge_no: string
  belge_konusu: string
  belge_tarihi: string
  belge_gizlilik_id: string
  belge_kategori_id: string
  belge_klasor_id: string
  belge_sayfa_sayisi: number
  belge_guv_knt_no: string
}
