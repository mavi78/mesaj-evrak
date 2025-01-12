import { GizlilikDerecesiService } from 'src/main/services/gizlilik-derecesi-service'
import { KategoriService } from 'src/main/services/kategori-service'
import { KlasorService } from 'src/main/services/klasor-service'
import { BirlikService } from 'src/main/services/birlik-service'
import { MesajEvrakService } from 'src/main/services/mesaj-evrak-service'
import { Database } from 'better-sqlite3'

export interface BaseServiceInstance {
  init(db: Database): void
  cleanup(): void
  serviceName: string
}

export interface ServiceType {
  klasor: KlasorService
  gizlilikDerecesi: GizlilikDerecesiService
  kategori: KategoriService
  birlik: BirlikService
  mesajEvrak: MesajEvrakService
}
