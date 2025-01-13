import { mesajEvrakSchema } from '../schemas/mesaj-evrak-schema'
import { errorLogsSchema } from '../schemas/error-logs-schema'
import { logKayitlariSchema } from '../schemas/log-kayitlari-schema'
import {
  gizlilikDereceleriSchema,
  klasorlerSchema,
  kategorilerSchema,
  kanallarSchema
} from '../schemas/referanslar-schema'
import { birliklerSchema } from '../schemas/birlikler-schema'
import { dagitimSchema } from '../schemas/dagitim-schema'
import { postaSchema } from '../schemas/posta-schema'
import { createPostaTrigger } from '../triggers/posta-trigger'

export const MESAJ_EVRAK_SCHEMA = mesajEvrakSchema
export const ERROR_LOGS_SCHEMA = errorLogsSchema
export const LOG_KAYITLARI_SCHEMA = logKayitlariSchema
export const GIZLILIK_DERECELERI_SCHEMA = gizlilikDereceleriSchema
export const KLASORLER_SCHEMA = klasorlerSchema
export const KATEGORILER_SCHEMA = kategorilerSchema
export const KANALLAR_SCHEMA = kanallarSchema
export const BIRLIKLER_SCHEMA = birliklerSchema
export const DAGITIM_SCHEMA = dagitimSchema
export const POSTA_SCHEMA = postaSchema
export const POSTA_TRIGGER = createPostaTrigger()
