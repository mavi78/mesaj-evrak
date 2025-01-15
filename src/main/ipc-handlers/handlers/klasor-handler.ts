import { BaseIpcHandler } from '../base/base-handler'
import { klasorService } from '../../services/klasor-service'
import { IKlasor } from '@shared/servisler/referanslar'

export class KlasorHandler extends BaseIpcHandler {
  protected readonly channel = 'klasor'

  public register(): void {
    // CRUD işlemleri
    this.registerHandler('getAll', () => klasorService.getAll())
    this.registerHandler('getById', (id: string) => klasorService.getById(id))
    this.registerHandler('create', (data: Partial<IKlasor>) => klasorService.create(data))
    this.registerHandler('update', (params: { id: string; data: Partial<IKlasor> }) =>
      klasorService.update(params.id, params.data)
    )
    this.registerHandler('delete', (id: string) => klasorService.delete(id))
  }
}
