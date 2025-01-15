import { AppError } from './app-error'
import type {
  IBirlikler,
  IDagitim,
  IMesajEvrak,
  IPosta,
  IGizlilikDerecesi,
  IKanallar,
  IKategori,
  IKlasor
} from './servisler'

export type ApiResponse<T> = Promise<T>

export interface IAppApi {
  checkDbConnection: () => Promise<boolean>
  onDbConnectionStatus: (callback: (status: boolean) => void) => void
  onLoadingMessage: (callback: (message: string) => void) => void
  onLoadingComplete: (callback: () => void) => void
  onUpdateLog: (callback: (message: string) => void) => void
  onError: (callback: (error: AppError) => void) => void
  removeOnLoadingMessageListener: () => void
  removeOnLoadingCompleteListener: () => void
  removeOnUpdateLogListener: () => void
  removeOnErrorListener: () => void
}

export interface IMesajEvrakApi {
  getById: (id: string) => ApiResponse<IMesajEvrak>
  getAll: () => ApiResponse<IMesajEvrak[]>
  create: (data: Partial<IMesajEvrak>) => ApiResponse<IMesajEvrak>
  update: (id: string, data: Partial<IMesajEvrak>) => ApiResponse<IMesajEvrak>
  delete: (id: string) => ApiResponse<void>
}

export interface IPostaApi {
  getById: (id: string) => ApiResponse<IPosta>
  getAll: () => ApiResponse<IPosta[]>
  create: (data: Partial<IPosta>) => ApiResponse<IPosta>
  update: (id: string, data: Partial<IPosta>) => ApiResponse<IPosta>
  delete: (id: string) => ApiResponse<void>
  getByMesajEvrakId: (mesajEvrakId: string) => ApiResponse<IPosta[]>
  getByBirlikId: (birlikId: string) => ApiResponse<IPosta[]>
  updateDurum: (id: string, durumu: boolean) => ApiResponse<void>
  updateTarih: (id: string, tarihi: string) => ApiResponse<void>
  updateRRKodu: (id: string, rrKodu: string) => ApiResponse<void>
}

export interface IDagitimApi {
  getById: (id: string) => ApiResponse<IDagitim>
  getAll: () => ApiResponse<IDagitim[]>
  create: (data: Omit<IDagitim, 'id'>) => ApiResponse<IDagitim>
  update: (dagitim: IDagitim) => ApiResponse<IDagitim>
  delete: (id: string) => ApiResponse<void>
  getByMesajEvrakId: (mesajEvrakId: string) => ApiResponse<IDagitim[]>
  getByBirlikId: (birlikId: string) => ApiResponse<IDagitim[]>
  getTeslimEdilmemis: () => ApiResponse<IDagitim[]>
  getEnYuksekSenetNo: (yil: number) => ApiResponse<number>
  topluSenetOlustur: (dagitimIds: string[]) => ApiResponse<void>
  kanalGuncelle: (dagitimId: string, yeniKanalId: string) => ApiResponse<void>
  search: (query: string, limit?: number, offset?: number) => ApiResponse<IDagitim[]>
}

export interface IKanalApi {
  getir: () => ApiResponse<IKanallar[]>
  getirById: (id: string) => ApiResponse<IKanallar>
  ekle: (params: { kanal: string }) => ApiResponse<IKanallar>
  guncelle: (params: { id: string; kanal: string }) => ApiResponse<IKanallar>
  sil: (id: string) => ApiResponse<void>
  getKuryeId: () => ApiResponse<string>
}

export interface IBirlikApi {
  getAll: () => ApiResponse<IBirlikler[]>
  getById: (id: string) => ApiResponse<IBirlikler>
  create: (data: Partial<IBirlikler>) => ApiResponse<IBirlikler>
  update: (id: string, data: Partial<IBirlikler>) => ApiResponse<IBirlikler>
  delete: (id: string) => ApiResponse<void>
  getByParentId: (parentId: string) => ApiResponse<IBirlikler[]>
}

export interface IGizlilikDerecesiApi {
  getAll: () => ApiResponse<IGizlilikDerecesi[]>
  getById: (id: string) => ApiResponse<IGizlilikDerecesi>
  create: (data: Partial<IGizlilikDerecesi>) => ApiResponse<IGizlilikDerecesi>
  update: (id: string, data: Partial<IGizlilikDerecesi>) => ApiResponse<IGizlilikDerecesi>
  delete: (id: string) => ApiResponse<void>
}

export interface IKategoriApi {
  getAll: () => ApiResponse<IKategori[]>
  getById: (id: string) => ApiResponse<IKategori>
  create: (data: Partial<IKategori>) => ApiResponse<IKategori>
  update: (id: string, data: Partial<IKategori>) => ApiResponse<IKategori>
  delete: (id: string) => ApiResponse<void>
  getByKategori: (kategori: string) => ApiResponse<IKategori[]>
}

export interface IKlasorApi {
  getAll: () => ApiResponse<IKlasor[]>
  getById: (id: string) => ApiResponse<IKlasor>
  create: (data: Partial<IKlasor>) => ApiResponse<IKlasor>
  update: (id: string, data: Partial<IKlasor>) => ApiResponse<IKlasor>
  delete: (id: string) => ApiResponse<void>
}
