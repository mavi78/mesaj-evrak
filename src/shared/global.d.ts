import { AppError } from '../errors/app-error'
import {
  IAppApi,
  IMesajEvrakApi,
  IPostaApi,
  IDagitimApi,
  IKanalApi,
  IBirlikApi,
  IGizlilikDerecesiApi,
  IKategoriApi,
  IKlasorApi
} from './api'

type IpcChannels = keyof IpcChannelMap

export type IpcChannelMap = {
  //app
  'app:checkDbConnection': { response: boolean; args: [] }
  'app:onDbConnectionStatus': { response: void; args: [status: boolean] }
  'app:onLoadingMessage': { response: void; args: [message: string] }
  'app:onLoadingComplete': { response: void; args: [] }
  'app:onUpdateLog': { response: void; args: [message: string] }
  'app:onError': { response: void; args: [error: AppError] }
  'app:removeOnLoadingMessageListener': { response: void; args: [] }
  'app:removeOnLoadingCompleteListener': { response: void; args: [] }
  'app:removeOnUpdateLogListener': { response: void; args: [] }
  'app:removeOnErrorListener': { response: void; args: [] }

  //mesaj-evrak
  'mesaj-evrak:getById': { response: IMesajEvrakApi['getById']; args: [id: string] }
  'mesaj-evrak:getAll': { response: IMesajEvrakApi['getAll']; args: [] }
  'mesaj-evrak:create': {
    response: IMesajEvrakApi['create']
    args: [data: Parameters<IMesajEvrakApi['create']>[0]]
  }
  'mesaj-evrak:update': {
    response: IMesajEvrakApi['update']
    args: [id: string, data: Parameters<IMesajEvrakApi['update']>[1]]
  }
  'mesaj-evrak:delete': { response: IMesajEvrakApi['delete']; args: [id: string] }

  //posta
  'posta:getById': { response: IPostaApi['getById']; args: [id: string] }
  'posta:getAll': { response: IPostaApi['getAll']; args: [] }
  'posta:create': {
    response: IPostaApi['create']
    args: [data: Parameters<IPostaApi['create']>[0]]
  }
  'posta:update': {
    response: IPostaApi['update']
    args: [id: string, data: Parameters<IPostaApi['update']>[1]]
  }
  'posta:delete': { response: IPostaApi['delete']; args: [id: string] }
  'posta:getByMesajEvrakId': {
    response: IPostaApi['getByMesajEvrakId']
    args: [mesajEvrakId: string]
  }
  'posta:getByBirlikId': { response: IPostaApi['getByBirlikId']; args: [birlikId: string] }
  'posta:updateDurum': { response: IPostaApi['updateDurum']; args: [id: string, durumu: boolean] }
  'posta:updateTarih': { response: IPostaApi['updateTarih']; args: [id: string, tarihi: string] }
  'posta:updateRRKodu': { response: IPostaApi['updateRRKodu']; args: [id: string, rrKodu: string] }

  //dagitim
  'dagitim:getById': { response: IDagitimApi['getById']; args: [id: string] }
  'dagitim:getAll': { response: IDagitimApi['getAll']; args: [] }
  'dagitim:create': {
    response: IDagitimApi['create']
    args: [data: Parameters<IDagitimApi['create']>[0]]
  }
  'dagitim:update': {
    response: IDagitimApi['update']
    args: [dagitim: Parameters<IDagitimApi['update']>[0]]
  }
  'dagitim:delete': { response: IDagitimApi['delete']; args: [id: string] }
  'dagitim:getByMesajEvrakId': {
    response: IDagitimApi['getByMesajEvrakId']
    args: [mesajEvrakId: string]
  }
  'dagitim:getByBirlikId': { response: IDagitimApi['getByBirlikId']; args: [birlikId: string] }
  'dagitim:getTeslimEdilmemis': { response: IDagitimApi['getTeslimEdilmemis']; args: [] }
  'dagitim:getEnYuksekSenetNo': { response: IDagitimApi['getEnYuksekSenetNo']; args: [yil: number] }
  'dagitim:topluSenetOlustur': {
    response: IDagitimApi['topluSenetOlustur']
    args: [dagitimIds: string[]]
  }
  'dagitim:kanalGuncelle': {
    response: IDagitimApi['kanalGuncelle']
    args: [dagitimId: string, yeniKanalId: string]
  }
  'dagitim:search': {
    response: IDagitimApi['search']
    args: [query: string, limit?: number, offset?: number]
  }

  //kanal
  'kanal:getir': { response: IKanalApi['getir']; args: [] }
  'kanal:getirById': { response: IKanalApi['getirById']; args: [id: string] }
  'kanal:ekle': { response: IKanalApi['ekle']; args: [params: Parameters<IKanalApi['ekle']>[0]] }
  'kanal:guncelle': {
    response: IKanalApi['guncelle']
    args: [params: Parameters<IKanalApi['guncelle']>[0]]
  }
  'kanal:sil': { response: IKanalApi['sil']; args: [id: string] }
  'kanal:getKuryeId': { response: IKanalApi['getKuryeId']; args: [] }

  //birlik
  'birlik:getAll': { response: IBirlikApi['getAll']; args: [] }
  'birlik:getById': { response: IBirlikApi['getById']; args: [id: string] }
  'birlik:create': {
    response: IBirlikApi['create']
    args: [data: Parameters<IBirlikApi['create']>[0]]
  }
  'birlik:update': {
    response: IBirlikApi['update']
    args: [id: string, data: Parameters<IBirlikApi['update']>[1]]
  }
  'birlik:delete': { response: IBirlikApi['delete']; args: [id: string] }
  'birlik:getByParentId': { response: IBirlikApi['getByParentId']; args: [parentId: string] }

  //gizlilik-derecesi
  'gizlilik-derecesi:getAll': { response: IGizlilikDerecesiApi['getAll']; args: [] }
  'gizlilik-derecesi:getById': { response: IGizlilikDerecesiApi['getById']; args: [id: string] }
  'gizlilik-derecesi:create': {
    response: IGizlilikDerecesiApi['create']
    args: [data: Parameters<IGizlilikDerecesiApi['create']>[0]]
  }
  'gizlilik-derecesi:update': {
    response: IGizlilikDerecesiApi['update']
    args: [id: string, data: Parameters<IGizlilikDerecesiApi['update']>[1]]
  }
  'gizlilik-derecesi:delete': { response: IGizlilikDerecesiApi['delete']; args: [id: string] }

  //kategori
  'kategori:getAll': { response: IKategoriApi['getAll']; args: [] }
  'kategori:getById': { response: IKategoriApi['getById']; args: [id: string] }
  'kategori:create': {
    response: IKategoriApi['create']
    args: [data: Parameters<IKategoriApi['create']>[0]]
  }
  'kategori:update': {
    response: IKategoriApi['update']
    args: [id: string, data: Parameters<IKategoriApi['update']>[1]]
  }
  'kategori:delete': { response: IKategoriApi['delete']; args: [id: string] }
  'kategori:getByKategori': { response: IKategoriApi['getByKategori']; args: [kategori: string] }

  //klasor
  'klasor:getAll': { response: IKlasorApi['getAll']; args: [] }
  'klasor:getById': { response: IKlasorApi['getById']; args: [id: string] }
  'klasor:create': {
    response: IKlasorApi['create']
    args: [data: Parameters<IKlasorApi['create']>[0]]
  }
  'klasor:update': {
    response: IKlasorApi['update']
    args: [id: string, data: Parameters<IKlasorApi['update']>[1]]
  }
  'klasor:delete': { response: IKlasorApi['delete']; args: [id: string] }
}

declare global {
  interface Window {
    api: {
      env: {
        NODE_ENV: string
      }
      app: IAppApi
      mesajEvrak: IMesajEvrakApi
      posta: IPostaApi
      dagitim: IDagitimApi
      kanal: IKanalApi
      birlik: IBirlikApi
      gizlilikDerecesi: IGizlilikDerecesiApi
      kategori: IKategoriApi
      klasor: IKlasorApi
    }
  }
}

export {}
