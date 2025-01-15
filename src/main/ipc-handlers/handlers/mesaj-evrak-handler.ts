import { BaseIpcHandler } from '../base/base-handler'
import { mesajEvrakService } from '../../services/mesaj-evrak-service'
import { IMesajEvrak } from '@shared/servisler/mesaj-evrak'

export class MesajEvrakHandler extends BaseIpcHandler {
  protected readonly channel = 'mesaj-evrak'

  public register(): void {
    // CRUD işlemleri
    this.registerHandler('getById', (id: string) => mesajEvrakService.getById(id))
    this.registerHandler('create', (data: Partial<IMesajEvrak>) => mesajEvrakService.create(data))
    this.registerHandler('update', (id: string, data: Partial<IMesajEvrak>) =>
      mesajEvrakService.update(id, data)
    )
    this.registerHandler('delete', (id: string) => mesajEvrakService.delete(id))

    // Sayfalama işlemleri
    this.registerHandler('getAllWithPagination', (page: number = 1, pageSize: number = 10) =>
      mesajEvrakService.getAllWithPagination(page, pageSize)
    )
    this.registerHandler('getTotalCount', () => mesajEvrakService.getTotalCount())

    // Arama işlemleri
    this.registerHandler('search', (keyword: string, page: number = 1, pageSize: number = 10) =>
      mesajEvrakService.search(keyword, page, pageSize)
    )
    this.registerHandler('getSearchCount', (keyword: string) =>
      mesajEvrakService.getSearchCount(keyword)
    )

    // Tarih bazlı sorgular
    this.registerHandler(
      'getByDateRange',
      (startDate: Date, endDate: Date, page: number = 1, pageSize: number = 10) =>
        mesajEvrakService.getByDateRange(startDate, endDate, page, pageSize)
    )
    this.registerHandler(
      'getByBelgeTarihi',
      (date: Date, page: number = 1, pageSize: number = 10) =>
        mesajEvrakService.getByBelgeTarihi(date, page, pageSize)
    )
    this.registerHandler(
      'getByCreatedAt',
      (startDate: Date, endDate: Date, page: number = 1, pageSize: number = 10) =>
        mesajEvrakService.getByCreatedAt(startDate, endDate, page, pageSize)
    )

    // İstatistik ve raporlama
    this.registerHandler('getLastDayDocuments', () => mesajEvrakService.getLastDayDocuments())
    this.registerHandler('getLastWeekDocuments', () => mesajEvrakService.getLastWeekDocuments())
    this.registerHandler('getDocumentStats', () => mesajEvrakService.getDocumentStats())
  }
}
