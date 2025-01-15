import { BaseIpcHandler } from '../base/base-handler'
import { kategoriService } from '../../services/kategori-service'
import { IKategori } from '@shared/servisler/referanslar'

export class KategoriHandler extends BaseIpcHandler {
  protected readonly channel = 'kategori'

  public register(): void {
    // CRUD işlemleri
    this.registerHandler('getAll', () => kategoriService.getAll())
    this.registerHandler('getById', (id: string) => kategoriService.getById(id))
    this.registerHandler('create', (data: Partial<IKategori>) => kategoriService.create(data))
    this.registerHandler('update', (params: { id: string; data: Partial<IKategori> }) =>
      kategoriService.update(params.id, params.data)
    )
    this.registerHandler('delete', (id: string) => kategoriService.delete(id))

    // Özel işlemler
    this.registerHandler('getByKategori', (kategori: string) =>
      kategoriService.getByKategori(kategori)
    )
  }
}
