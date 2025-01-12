import { IBaseService } from './base-servis'

export interface IBirlikler extends IBaseService {
  birlik_adi: string
  birlik_tanitim_kodu: string
  birlik_tipi: 'KOMUTANLIK' | 'BİRLİK' | 'ŞUBE'
  ust_birlik_id: string
}
