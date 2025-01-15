import { contextBridge, ipcRenderer } from 'electron'
import { AppError } from '../shared/app-error'
import type {
  IBirlikler,
  IDagitim,
  IMesajEvrak,
  IPosta,
  IGizlilikDerecesi,
  IKanallar,
  IKategori,
  IKlasor
} from '../shared/servisler'

const api = {
  process: {
    env: {
      NODE_ENV: process.env.NODE_ENV
    }
  },
  app: {
    checkDbConnection: async (): Promise<boolean> => {
      try {
        return await ipcRenderer.invoke('app:checkDbConnection')
      } catch (error) {
        console.error(error)
        return false
      }
    },
    onDbConnectionStatus: (callback: (status: boolean) => void): void => {
      try {
        ipcRenderer.on('app:dbConnectionStatus', (_, status) => callback(status))
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    onLoadingMessage: (callback: (message: string) => void): void => {
      try {
        ipcRenderer.on('app:onLoadingMessage', (_, message) => callback(message))
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    onLoadingComplete: (callback: () => void): void => {
      try {
        ipcRenderer.on('app:onLoadingComplete', () => callback())
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    onUpdateLog: (callback: (message: string) => void): void => {
      try {
        ipcRenderer.on('app:onUpdateLog', (_, message) => callback(message))
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    // hata olayı
    onError: (callback: (error: AppError) => void): void => {
      try {
        ipcRenderer.on('app:onError', (_, error) => callback(error))
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    removeOnLoadingMessageListener: (): void => {
      ipcRenderer.removeAllListeners('app:onLoadingMessage')
    },
    removeOnLoadingCompleteListener: (): void => {
      ipcRenderer.removeAllListeners('app:onLoadingComplete')
    },
    removeOnUpdateLogListener: (): void => {
      ipcRenderer.removeAllListeners('app:onUpdateLog')
    },
    removeOnErrorListener: (): void => {
      ipcRenderer.removeAllListeners('app:onError')
    }
  },
  // Mesaj/Evrak API
  mesajEvrak: {
    getById: async (id: string): Promise<IMesajEvrak> => {
      try {
        return await ipcRenderer.invoke('mesaj-evrak:getById', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getAll: async (): Promise<IMesajEvrak[]> => {
      try {
        return await ipcRenderer.invoke('mesaj-evrak:getAll')
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    create: async (data: Partial<IMesajEvrak>): Promise<IMesajEvrak> => {
      try {
        return await ipcRenderer.invoke('mesaj-evrak:create', data)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    update: async (id: string, data: Partial<IMesajEvrak>): Promise<IMesajEvrak> => {
      try {
        return await ipcRenderer.invoke('mesaj-evrak:update', id, data)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('mesaj-evrak:delete', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  },
  // Posta API
  posta: {
    getById: async (id: string): Promise<IPosta> => {
      try {
        return await ipcRenderer.invoke('posta:getById', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getAll: async (): Promise<IPosta[]> => {
      try {
        return await ipcRenderer.invoke('posta:getAll')
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    create: async (data: Partial<IPosta>): Promise<IPosta> => {
      try {
        return await ipcRenderer.invoke('posta:create', data)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    update: async (id: string, data: Partial<IPosta>): Promise<IPosta> => {
      try {
        return await ipcRenderer.invoke('posta:update', id, data)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('posta:delete', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getByMesajEvrakId: async (mesajEvrakId: string): Promise<IPosta[]> => {
      try {
        return await ipcRenderer.invoke('posta:getByMesajEvrakId', mesajEvrakId)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getByBirlikId: async (birlikId: string): Promise<IPosta[]> => {
      try {
        return await ipcRenderer.invoke('posta:getByBirlikId', birlikId)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    updateDurum: async (id: string, durumu: boolean): Promise<void> => {
      try {
        return await ipcRenderer.invoke('posta:updateDurum', id, durumu)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    updateTarih: async (id: string, tarihi: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('posta:updateTarih', id, tarihi)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    updateRRKodu: async (id: string, rrKodu: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('posta:updateRRKodu', id, rrKodu)
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  },
  // Dağıtım API
  dagitim: {
    getById: async (id: string): Promise<IDagitim> => {
      try {
        return await ipcRenderer.invoke('dagitim:getById', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getAll: async (): Promise<IDagitim[]> => {
      try {
        return await ipcRenderer.invoke('dagitim:getAll')
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    create: async (data: Omit<IDagitim, 'id'>): Promise<IDagitim> => {
      try {
        return await ipcRenderer.invoke('dagitim:create', data)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    update: async (dagitim: IDagitim): Promise<IDagitim> => {
      try {
        return await ipcRenderer.invoke('dagitim:update', dagitim)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('dagitim:delete', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getByMesajEvrakId: async (mesajEvrakId: string): Promise<IDagitim[]> => {
      try {
        return await ipcRenderer.invoke('dagitim:getByMesajEvrakId', mesajEvrakId)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getByBirlikId: async (birlikId: string): Promise<IDagitim[]> => {
      try {
        return await ipcRenderer.invoke('dagitim:getByBirlikId', birlikId)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getTeslimEdilmemis: async (): Promise<IDagitim[]> => {
      try {
        return await ipcRenderer.invoke('dagitim:getTeslimEdilmemis')
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getEnYuksekSenetNo: async (yil: number): Promise<number> => {
      try {
        return await ipcRenderer.invoke('dagitim:getEnYuksekSenetNo', yil)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    topluSenetOlustur: async (dagitimIds: string[]): Promise<void> => {
      try {
        return await ipcRenderer.invoke('dagitim:topluSenetOlustur', dagitimIds)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    kanalGuncelle: async (dagitimId: string, yeniKanalId: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('dagitim:kanalGuncelle', dagitimId, yeniKanalId)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    search: async (query: string, limit: number = 10, offset: number = 0): Promise<IDagitim[]> => {
      try {
        return await ipcRenderer.invoke('dagitim:search', query, limit, offset)
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  },
  // Kanal API
  kanal: {
    getir: async (): Promise<IKanallar[]> => {
      try {
        return await ipcRenderer.invoke('kanal:getir')
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getirById: async (id: string): Promise<IKanallar> => {
      try {
        return await ipcRenderer.invoke('kanal:getirById', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    ekle: async (params: { kanal: string }): Promise<IKanallar> => {
      try {
        return await ipcRenderer.invoke('kanal:ekle', params)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    guncelle: async (params: { id: string; kanal: string }): Promise<IKanallar> => {
      try {
        return await ipcRenderer.invoke('kanal:guncelle', params)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    sil: async (id: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('kanal:sil', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getKuryeId: async (): Promise<string> => {
      try {
        return await ipcRenderer.invoke('kanal:getKuryeId')
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  },
  // Birlik API
  birlik: {
    getAll: async (): Promise<IBirlikler[]> => {
      try {
        return await ipcRenderer.invoke('birlik:getAll')
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getById: async (id: string): Promise<IBirlikler> => {
      try {
        return await ipcRenderer.invoke('birlik:getById', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    create: async (data: Partial<IBirlikler>): Promise<IBirlikler> => {
      try {
        return await ipcRenderer.invoke('birlik:create', data)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    update: async (id: string, data: Partial<IBirlikler>): Promise<IBirlikler> => {
      try {
        return await ipcRenderer.invoke('birlik:update', { id, data })
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('birlik:delete', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getByParentId: async (parentId: string): Promise<IBirlikler[]> => {
      try {
        return await ipcRenderer.invoke('birlik:getByParentId', parentId)
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  },
  // Gizlilik Derecesi API
  gizlilikDerecesi: {
    getAll: async (): Promise<IGizlilikDerecesi[]> => {
      try {
        return await ipcRenderer.invoke('gizlilik-derecesi:getAll')
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getById: async (id: string): Promise<IGizlilikDerecesi> => {
      try {
        return await ipcRenderer.invoke('gizlilik-derecesi:getById', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    create: async (data: Partial<IGizlilikDerecesi>): Promise<IGizlilikDerecesi> => {
      try {
        return await ipcRenderer.invoke('gizlilik-derecesi:create', data)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    update: async (id: string, data: Partial<IGizlilikDerecesi>): Promise<IGizlilikDerecesi> => {
      try {
        return await ipcRenderer.invoke('gizlilik-derecesi:update', { id, data })
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('gizlilik-derecesi:delete', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  },
  // Kategori API
  kategori: {
    getAll: async (): Promise<IKategori[]> => {
      try {
        return await ipcRenderer.invoke('kategori:getAll')
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getById: async (id: string): Promise<IKategori> => {
      try {
        return await ipcRenderer.invoke('kategori:getById', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    create: async (data: Partial<IKategori>): Promise<IKategori> => {
      try {
        return await ipcRenderer.invoke('kategori:create', data)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    update: async (id: string, data: Partial<IKategori>): Promise<IKategori> => {
      try {
        return await ipcRenderer.invoke('kategori:update', { id, data })
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('kategori:delete', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getByKategori: async (kategori: string): Promise<IKategori[]> => {
      try {
        return await ipcRenderer.invoke('kategori:getByKategori', kategori)
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  },
  // Klasör API
  klasor: {
    getAll: async (): Promise<IKlasor[]> => {
      try {
        return await ipcRenderer.invoke('klasor:getAll')
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    getById: async (id: string): Promise<IKlasor> => {
      try {
        return await ipcRenderer.invoke('klasor:getById', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    create: async (data: Partial<IKlasor>): Promise<IKlasor> => {
      try {
        return await ipcRenderer.invoke('klasor:create', data)
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    update: async (id: string, data: Partial<IKlasor>): Promise<IKlasor> => {
      try {
        return await ipcRenderer.invoke('klasor:update', { id, data })
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        return await ipcRenderer.invoke('klasor:delete', id)
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

// Cleanup işlemleri için event listener'ları kaldır
window.addEventListener('unload', () => {
  ipcRenderer.removeAllListeners('app:onLoadingMessage')
  ipcRenderer.removeAllListeners('app:onLoadingComplete')
  ipcRenderer.removeAllListeners('app:onUpdateLog')
  ipcRenderer.removeAllListeners('app:onError')
})
