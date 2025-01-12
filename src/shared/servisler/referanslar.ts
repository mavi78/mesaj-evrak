import { IBaseService } from './base-servis'

interface IReferanslar {
  varsayılan: boolean
}

export interface IGizlilikDerecesi extends IBaseService, IReferanslar {
  gizlilik_derecesi: string
  guvenlik_kodu_gereklimi: boolean
}

export interface IKlasor extends IBaseService, IReferanslar {
  klasor: string
}

export interface IKategori extends IBaseService, IReferanslar {
  kategori: string
}

export interface IKanallar extends IBaseService, IReferanslar {
  kanal: string // KURYE ve POSTA ilk kayıtlar olacak bunlar silinemez ve değiştirilemez sonra diğer kanallar eklenir
  is_system: boolean
}
