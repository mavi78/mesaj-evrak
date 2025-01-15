import { BaseIpcHandler } from '../base/base-handler'
import { kanalService } from '../../services/kanal-service'

export class KanalHandler extends BaseIpcHandler {
  protected readonly channel = 'kanal'

  public register(): void {
    // CRUD işlemleri
    this.registerHandler('getir', () => kanalService.getir())
    this.registerHandler('getirById', (id: string) => kanalService.getirById(id))
    this.registerHandler('ekle', (params: { kanal: string }) => kanalService.ekle(params))
    this.registerHandler('guncelle', (params: { id: string; kanal: string }) =>
      kanalService.guncelle(params)
    )
    this.registerHandler('sil', (id: string) => kanalService.sil(id))

    // Özel işlemler
    this.registerHandler('getKuryeId', () => kanalService.getKuryeId())
  }
}
