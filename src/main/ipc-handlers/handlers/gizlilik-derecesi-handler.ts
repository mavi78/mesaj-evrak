import { BaseIpcHandler } from '../base/base-handler'
import { gizlilikDerecesiService } from '../../services/gizlilik-derecesi-service'
import { IGizlilikDerecesi } from '@shared/servisler/referanslar'

export class GizlilikDerecesiHandler extends BaseIpcHandler {
  protected readonly channel = 'gizlilik-derecesi'

  public register(): void {
    // CRUD işlemleri
    this.registerHandler('getAll', () => gizlilikDerecesiService.getAll())
    this.registerHandler('getById', (id: string) => gizlilikDerecesiService.getById(id))
    this.registerHandler('create', (data: Partial<IGizlilikDerecesi>) =>
      gizlilikDerecesiService.create(data)
    )
    this.registerHandler('update', (params: { id: string; data: Partial<IGizlilikDerecesi> }) =>
      gizlilikDerecesiService.update(params.id, params.data)
    )
    this.registerHandler('delete', (id: string) => gizlilikDerecesiService.delete(id))
  }
}
