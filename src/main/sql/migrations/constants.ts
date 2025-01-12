import { errorLogSchema } from '../schemas/error-logs-schema'
import {
  gizlilikDereceleriSchema,
  klasorlerSchema,
  kategorilerSchema
} from '../schemas/referanslar-schema'
import { birliklerSchema } from '../schemas/birlikler-schema'
import { mesajEvrakSchema } from '../schemas/mesaj-evrak-schema'
import { sayacSchema } from '../schemas/sayac-schema'

export const ERROR_LOG_SCHEMA = errorLogSchema
export const GIZLILIK_DERECELERI_SCHEMA = gizlilikDereceleriSchema
export const KLASORLER_SCHEMA = klasorlerSchema
export const KATEGORILER_SCHEMA = kategorilerSchema
export const BIRLIKLER_SCHEMA = birliklerSchema
export const MESAJ_EVRAK_SCHEMA = mesajEvrakSchema
export const SAYAC_SCHEMA = sayacSchema
