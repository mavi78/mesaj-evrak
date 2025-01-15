import { BaseIpcHandler } from '../base/base-handler'
import { dagitimService } from '../../services/dagitim-service'
import { IDagitim } from '@shared/servisler/dagitim'

export class DagitimHandler extends BaseIpcHandler {
  protected readonly channel = 'dagitim'

  public register(): void {
    // CRUD işlemleri
    this.registerHandler('getById', (id: string) => dagitimService.getByIdPublic(id))
    this.registerHandler('getAll', () => dagitimService.getAllPublic())
    this.registerHandler('create', (data: Omit<IDagitim, 'id'>) => dagitimService.create(data))
    this.registerHandler('update', (dagitim: IDagitim) => dagitimService.update(dagitim))
    this.registerHandler('delete', (id: string) => dagitimService.delete(id))

    // Özel sorgular
    this.registerHandler('getByMesajEvrakId', (mesajEvrakId: string) =>
      dagitimService.getByMesajEvrakId(mesajEvrakId)
    )
    this.registerHandler('getByBirlikId', (birlikId: string) =>
      dagitimService.getByBirlikId(birlikId)
    )
    this.registerHandler('getTeslimEdilmemis', () => dagitimService.getTeslimEdilmemis())

    // Senet işlemleri
    this.registerHandler('getEnYuksekSenetNo', (yil: number) =>
      dagitimService.getEnYuksekSenetNo(yil)
    )
    this.registerHandler('topluSenetOlustur', (dagitimIds: string[]) =>
      dagitimService.topluSenetOlustur(dagitimIds)
    )

    // Kanal işlemleri
    this.registerHandler('kanalGuncelle', (dagitimId: string, yeniKanalId: string) =>
      dagitimService.kanalGuncelle(dagitimId, yeniKanalId)
    )

    // Arama
    this.registerHandler('search', (query: string, limit: number = 10, offset: number = 0) =>
      dagitimService.search(query, limit, offset)
    )
  }
}
