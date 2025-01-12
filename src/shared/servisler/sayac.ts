import { IBaseService } from './base-servis'

export interface ISayacNumaralari {
  kayit_no: number
  gun_sira_no: number
}

export interface ISayac extends IBaseService {
  belge_cinsi: 'GELEN' | 'GİDEN' | 'TRANSİT'
  yil: string
  readonly son_kayit_no: number
  gun: string
  readonly son_gun_sira_no: number
}

export interface ISayacService {
  getBelgeNumaralari(belge_cinsi: string, kayit_tarihi: string): Promise<ISayacNumaralari>
  create(data: Partial<ISayac>): Promise<ISayac>
  update(id: string, data: Partial<ISayac>): Promise<ISayac>
  getSayacIstatistikleri(): Promise<ISayac[]>
}
