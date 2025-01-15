import { BaseIpcHandler } from '../base/base-handler'
import { birlikService } from '../../services/birlik-service'
import { IBirlikler } from '@shared/servisler/birlikler'

export class BirlikHandler extends BaseIpcHandler {
  protected readonly channel = 'birlik'

  public register(): void {
    // CRUD işlemleri
    this.registerHandler('getAll', () => birlikService.getAll())
    this.registerHandler('getById', (id: string) => birlikService.getById(id))
    this.registerHandler('create', (data: Partial<IBirlikler>) => birlikService.create(data))
    this.registerHandler('update', (params: { id: string; data: Partial<IBirlikler> }) =>
      birlikService.update(params.id, params.data)
    )
    this.registerHandler('delete', (id: string) => birlikService.delete(id))

    // Özel işlemler
    this.registerHandler('getByParentId', (parentId: string) =>
      birlikService.getByParentId(parentId)
    )
  }
}
