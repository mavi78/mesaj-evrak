import { create } from 'zustand'
import type { IMesajEvrak } from '@shared/servisler'

interface MesajEvrakState {
  mesajEvraklar: IMesajEvrak[]
  seciliMesajEvrak: IMesajEvrak | null
  searchQuery: string
  page: number
  pageSize: number
  totalCount: number
  setMesajEvraklar: (mesajEvraklar: IMesajEvrak[]) => void
  setSeciliMesajEvrak: (mesajEvrak: IMesajEvrak | null) => void
  setSearchQuery: (query: string) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setTotalCount: (count: number) => void
}

export const useMesajEvrakStore = create<MesajEvrakState>((set) => ({
  mesajEvraklar: [],
  seciliMesajEvrak: null,
  searchQuery: '',
  page: 1,
  pageSize: 10,
  totalCount: 0,
  setMesajEvraklar: (mesajEvraklar) => set({ mesajEvraklar }),
  setSeciliMesajEvrak: (mesajEvrak) => set({ seciliMesajEvrak: mesajEvrak }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
  setTotalCount: (count) => set({ totalCount: count })
}))
