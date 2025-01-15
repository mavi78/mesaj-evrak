import { create } from 'zustand'
import type {
  IGizlilikDerecesi,
  IKanallar,
  IKategori,
  IKlasor,
  IBirlikler
} from '@shared/servisler'

interface ReferansState {
  kanallar: IKanallar[]
  birlikler: IBirlikler[]
  gizlilikDereceleri: IGizlilikDerecesi[]
  kategoriler: IKategori[]
  klasorler: IKlasor[]
  setKanallar: (kanallar: IKanallar[]) => void
  setBirlikler: (birlikler: IBirlikler[]) => void
  setGizlilikDereceleri: (gizlilikDereceleri: IGizlilikDerecesi[]) => void
  setKategoriler: (kategoriler: IKategori[]) => void
  setKlasorler: (klasorler: IKlasor[]) => void
}

export const useReferansStore = create<ReferansState>((set) => ({
  kanallar: [],
  birlikler: [],
  gizlilikDereceleri: [],
  kategoriler: [],
  klasorler: [],
  setKanallar: (kanallar) => set({ kanallar }),
  setBirlikler: (birlikler) => set({ birlikler }),
  setGizlilikDereceleri: (gizlilikDereceleri) => set({ gizlilikDereceleri }),
  setKategoriler: (kategoriler) => set({ kategoriler }),
  setKlasorler: (klasorler) => set({ klasorler })
}))
