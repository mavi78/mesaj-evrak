import { BaseIpcHandler } from '../base/base-handler'
import { postaService } from '../../services/posta-service'
import { IPosta } from '@shared/servisler/posta'

export class PostaHandler extends BaseIpcHandler {
  protected readonly channel = 'posta'

  public register(): void {
    // CRUD işlemleri
    this.registerHandler('getById', (id: string) => postaService.getById(id))
    this.registerHandler('getAll', () => postaService.getAll())
    this.registerHandler('create', (data: Partial<IPosta>) => postaService.create(data))
    this.registerHandler('update', (id: string, data: Partial<IPosta>) =>
      postaService.update(id, data)
    )
    this.registerHandler('delete', (id: string) => postaService.delete(id))

    // Özel sorgular
    this.registerHandler('getByMesajEvrakId', (mesajEvrakId: string) =>
      postaService.getByMesajEvrakId(mesajEvrakId)
    )
    this.registerHandler('getByBirlikId', (birlikId: string) =>
      postaService.getByBirlikId(birlikId)
    )

    // Güncelleme işlemleri
    this.registerHandler('updateDurum', (id: string, durumu: boolean) =>
      postaService.updateDurum(id, durumu)
    )
    this.registerHandler('updateTarih', (id: string, tarihi: string) =>
      postaService.updateTarih(id, tarihi)
    )
    this.registerHandler('updateRRKodu', (id: string, rrKodu: string) =>
      postaService.updateRRKodu(id, rrKodu)
    )
  }
}
