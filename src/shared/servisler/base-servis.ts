export interface IBaseService {
  id: string
  is_locked: boolean
  locked_by: string
  locked_at: Date | null
  updated_at: Date | null
  created_at: Date | null
  computer_name: string //uygulamanın açıldığı bilgisayar adı
  user_name: string //o bilgisayardaki mevcut kullanıcı adı
}
