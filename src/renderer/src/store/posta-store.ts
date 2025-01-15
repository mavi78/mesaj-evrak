import { create } from 'zustand'
import type { IPosta } from '@shared/servisler'

interface PostaState {
  postalar: IPosta[]
  seciliPosta: IPosta | null
  searchQuery: string
  page: number
  pageSize: number
  totalCount: number
  setPostalar: (postalar: IPosta[]) => void
  setSeciliPosta: (posta: IPosta | null) => void
  setSearchQuery: (query: string) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setTotalCount: (count: number) => void
}

export const usePostaStore = create<PostaState>((set) => ({
  postalar: [],
  seciliPosta: null,
  searchQuery: '',
  page: 1,
  pageSize: 10,
  totalCount: 0,
  setPostalar: (postalar) => set({ postalar }),
  setSeciliPosta: (posta) => set({ seciliPosta: posta }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
  setTotalCount: (count) => set({ totalCount: count })
}))
