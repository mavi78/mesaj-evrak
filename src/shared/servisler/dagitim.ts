import { IBaseService } from './base-servis'

export interface Dagitim extends IBaseService {
  birlik_id: string //seçilen birlik id
  ust_birlik_id: string //seçilen birlik ust birlik id
  dagitim_tarihi: Date //dagitim tarihi
  mesaj_evrak_id: string //seçilen mesaj evrak id
  kanal_id: string //seçilen kanal id DEFAULT değeri KURYE id si neyse o olacak olacak
  belge_guv_knt_no: string //belge güvenlik kontrol no mesajdakiyle eğer GELEN yada TRANSİT ise mesajdakiyle aynı olacak GİDEN ise ayrı olacak kullanıcı elle girecek
  teslim_durumu: boolean //teslim durumu
  senet_no: number //senet no
  teslim_tarihi: Date //teslim tarihi
}
