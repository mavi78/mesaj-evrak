import { IBaseService } from './base-servis'

export interface IPosta extends IBaseService {
  mesaj_evrak_id: string
  birlikler_id: string
  ust_birlik_id: string
  posta_durumu: boolean
  posta_tarihi: Date | null
  posta_rr_kodu: string
}
