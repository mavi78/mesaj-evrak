import { create } from 'zustand'
import type { IDagitim } from '@shared/servisler'

interface DagitimState {
  dagitimlar: IDagitim[]
  seciliDagitim: IDagitim | null
  teslimEdilmemisler: IDagitim[]
  searchQuery: string
  page: number
  pageSize: number
  totalCount: number
  setDagitimlar: (dagitimlar: IDagitim[]) => void
  setSeciliDagitim: (dagitim: IDagitim | null) => void
  setTeslimEdilmemisler: (dagitimlar: IDagitim[]) => void
  setSearchQuery: (query: string) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setTotalCount: (count: number) => void
}

export const useDagitimStore = create<DagitimState>((set) => ({
  dagitimlar: [],
  seciliDagitim: null,
  teslimEdilmemisler: [],
  searchQuery: '',
  page: 1,
  pageSize: 10,
  totalCount: 0,
  setDagitimlar: (dagitimlar) => set({ dagitimlar }),
  setSeciliDagitim: (dagitim) => set({ seciliDagitim: dagitim }),
  setTeslimEdilmemisler: (dagitimlar) => set({ teslimEdilmemisler: dagitimlar }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
  setTotalCount: (count) => set({ totalCount: count })
}))
