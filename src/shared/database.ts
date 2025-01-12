import { Statement } from 'better-sqlite3'

export type TypeConverter<T> = {
  [K in keyof T]: (value: any) => T[K]
}

export interface BaseStatements {
  getAll: Statement
  getById: Statement
  create: Statement
  update: Statement
  delete: Statement
}

export interface ReferansStatements extends BaseStatements {}

export interface GizlilikDerecesiStatements extends ReferansStatements {}

export interface KlasorStatements extends ReferansStatements {}

export interface KategoriStatements extends ReferansStatements {
  getByKategori: Statement
}

export interface BirlikStatements extends BaseStatements {
  getByParentId: Statement
}

export interface SayacStatements extends BaseStatements {
  getBelgeCinsiAndTarih: Statement
  getSayacIstatistikleri: Statement
}

export interface KanalStatements extends BaseStatements {
  getKuryeId: Statement
}

export interface MesajEvrakStatements extends BaseStatements {
  search: Statement
  getTotalCount: Statement
  getSearchCount: Statement
  getByDateRange: Statement
  getByBelgeTarihi: Statement
  getByCreatedAt: Statement
  getLastDayDocuments: Statement
  getLastWeekDocuments: Statement
  getDocumentStats: Statement
  getAllWithPagination: Statement
}

export interface DagitimStatements extends BaseStatements {
  getByMesajEvrakId: Statement
  getByBirlikId: Statement
  getTeslimEdilmemis: Statement
  getSonSenetNo: Statement
  topluSenetGuncelle: Statement
  search: Statement
}
