export const logKayitlariSchema = `
  -- Log kayıtları tablosu
  CREATE TABLE IF NOT EXISTS log_kayitlari (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT,
    computer_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    islem_turu TEXT NOT NULL CHECK (islem_turu IN ('INSERT', 'UPDATE', 'DELETE')),
    tablo_adi TEXT NOT NULL,
    kayit_id TEXT NOT NULL,
    eski_degerler TEXT CHECK (json_valid(COALESCE(eski_degerler, '{}'))),
    yeni_degerler TEXT NOT NULL CHECK (json_valid(yeni_degerler))
  );

  -- Log kayıtları için indeksler
  CREATE INDEX IF NOT EXISTS idx_log_kayitlari_created_at ON log_kayitlari(created_at);
  CREATE INDEX IF NOT EXISTS idx_log_kayitlari_islem_turu ON log_kayitlari(islem_turu);
  CREATE INDEX IF NOT EXISTS idx_log_kayitlari_tablo_adi ON log_kayitlari(tablo_adi);
  CREATE INDEX IF NOT EXISTS idx_log_kayitlari_kayit_id ON log_kayitlari(kayit_id);
  CREATE INDEX IF NOT EXISTS idx_log_kayitlari_computer ON log_kayitlari(computer_name);
  CREATE INDEX IF NOT EXISTS idx_log_kayitlari_user ON log_kayitlari(user_name);

  -- Son 24 saat içindeki loglar view'ı
  CREATE VIEW IF NOT EXISTS vw_recent_logs AS
  SELECT *
  FROM log_kayitlari
  WHERE datetime(created_at) >= datetime('now', '-24 hours')
  ORDER BY created_at DESC;

  -- Log istatistikleri view'ı
  CREATE VIEW IF NOT EXISTS vw_log_stats AS
  SELECT 
    tablo_adi,
    islem_turu,
    COUNT(*) as islem_sayisi,
    MIN(created_at) as ilk_islem,
    MAX(created_at) as son_islem,
    computer_name,
    user_name
  FROM log_kayitlari
  GROUP BY tablo_adi, islem_turu, computer_name, user_name;

  -- Otomatik temizleme trigger'ı (90 günden eski kayıtları siler)
  CREATE TRIGGER IF NOT EXISTS trg_cleanup_old_logs
  AFTER INSERT ON log_kayitlari
  BEGIN
    DELETE FROM log_kayitlari 
    WHERE datetime(created_at) < datetime('now', '-90 days');
  END;

  -- Mesaj/Evrak log trigger'ları
  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_insert_log
  AFTER INSERT ON mesaj_evrak
  BEGIN
    INSERT INTO log_kayitlari (
      id,
      islem_turu,
      tablo_adi,
      kayit_id,
      yeni_degerler,
      computer_name,
      user_name
    ) 
    VALUES (
      (SELECT hex(randomblob(16))),
      'INSERT',
      'mesaj_evrak',
      NEW.id,
      json_object(
        'belge_tipi', NEW.belge_tipi,
        'belge_tarihi', NEW.belge_tarihi,
        'belge_no', NEW.belge_no,
        'belge_konusu', NEW.belge_konusu,
        'gonderen_birlik_id', NEW.gonderen_birlik_id,
        'belge_gizlilik_id', NEW.belge_gizlilik_id,
        'belge_kategori_id', NEW.belge_kategori_id,
        'belge_klasor_id', NEW.belge_klasor_id,
        'belge_sayfa_sayisi', NEW.belge_sayfa_sayisi
      ),
      NEW.computer_name,
      NEW.user_name
    );
  END;

  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_update_log
  AFTER UPDATE ON mesaj_evrak
  BEGIN
    INSERT INTO log_kayitlari (
      id,
      islem_turu,
      tablo_adi, 
      kayit_id,
      eski_degerler,
      yeni_degerler,
      computer_name,
      user_name
    )
    VALUES (
      (SELECT hex(randomblob(16))),
      'UPDATE',
      'mesaj_evrak',
      OLD.id,
      json_object(
        'belge_tipi', OLD.belge_tipi,
        'belge_tarihi', OLD.belge_tarihi,
        'belge_no', OLD.belge_no,
        'belge_konusu', OLD.belge_konusu,
        'gonderen_birlik_id', OLD.gonderen_birlik_id,
        'belge_gizlilik_id', OLD.belge_gizlilik_id,
        'belge_kategori_id', OLD.belge_kategori_id,
        'belge_klasor_id', OLD.belge_klasor_id,
        'belge_sayfa_sayisi', OLD.belge_sayfa_sayisi
      ),
      json_object(
        'belge_tipi', NEW.belge_tipi,
        'belge_tarihi', NEW.belge_tarihi,
        'belge_no', NEW.belge_no,
        'belge_konusu', NEW.belge_konusu,
        'gonderen_birlik_id', NEW.gonderen_birlik_id,
        'belge_gizlilik_id', NEW.belge_gizlilik_id,
        'belge_kategori_id', NEW.belge_kategori_id,
        'belge_klasor_id', NEW.belge_klasor_id,
        'belge_sayfa_sayisi', NEW.belge_sayfa_sayisi
      ),
      NEW.computer_name,
      NEW.user_name
    );
  END;

  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_delete_log
  AFTER DELETE ON mesaj_evrak
  BEGIN
    INSERT INTO log_kayitlari (
      id,
      islem_turu,
      tablo_adi,
      kayit_id,
      eski_degerler,
      yeni_degerler,
      computer_name,
      user_name
    )
    VALUES (
      (SELECT hex(randomblob(16))),
      'DELETE',
      'mesaj_evrak',
      OLD.id,
      json_object(
        'belge_tipi', OLD.belge_tipi,
        'belge_tarihi', OLD.belge_tarihi,
        'belge_no', OLD.belge_no,
        'belge_konusu', OLD.belge_konusu,
        'gonderen_birlik_id', OLD.gonderen_birlik_id,
        'belge_gizlilik_id', OLD.belge_gizlilik_id,
        'belge_kategori_id', OLD.belge_kategori_id,
        'belge_klasor_id', OLD.belge_klasor_id,
        'belge_sayfa_sayisi', OLD.belge_sayfa_sayisi
      ),
      '{}',
      OLD.computer_name,
      OLD.user_name
    );
  END;
`
