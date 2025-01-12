export const mesajEvrakSchema = `
  -- Yardımcı fonksiyonlar
  CREATE TABLE IF NOT EXISTS aylar (
    tr_kisaltma TEXT PRIMARY KEY,
    en_kisaltma TEXT NOT NULL
  );
  
  INSERT OR IGNORE INTO aylar (tr_kisaltma, en_kisaltma) VALUES
    ('OCA', 'JAN'), ('ŞUB', 'FEB'), ('MAR', 'MAR'), ('NİS', 'APR'),
    ('MAY', 'MAY'), ('HAZ', 'JUN'), ('TEM', 'JUL'), ('AĞU', 'AUG'),
    ('EYL', 'SEP'), ('EKİ', 'OCT'), ('KAS', 'NOV'), ('ARA', 'DEC');

  -- Tarih format kontrolü için tablo
  CREATE TABLE IF NOT EXISTS format_kontrol (
    id INTEGER PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Evrak formatı kontrolü (dd.MM.yyyy)
  CREATE TRIGGER IF NOT EXISTS check_evrak_format
  BEFORE INSERT ON format_kontrol
  BEGIN
    SELECT CASE
      WHEN NEW.value NOT REGEXP '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$' THEN 
        RAISE(ABORT, 'Geçersiz evrak tarihi formatı. Beklenen: dd.MM.yyyy')
      WHEN CAST(substr(NEW.value, 1, 2) AS INTEGER) NOT BETWEEN 1 AND 31 THEN
        RAISE(ABORT, 'Geçersiz gün değeri')
      WHEN CAST(substr(NEW.value, 4, 2) AS INTEGER) NOT BETWEEN 1 AND 12 THEN
        RAISE(ABORT, 'Geçersiz ay değeri')
    END;
  END;

  -- Mesaj formatı kontrolü (ddHHmmX LLL yy)
  CREATE TRIGGER IF NOT EXISTS check_mesaj_format
  BEFORE INSERT ON format_kontrol
  BEGIN
    SELECT CASE
      WHEN NEW.value NOT REGEXP '^[0-9]{6}[CBZ] [A-ZĞÜŞİÖÇ]{3} [0-9]{2}$' THEN
        RAISE(ABORT, 'Geçersiz mesaj tarihi formatı. Beklenen: ddHHmmX LLL yy')
      WHEN CAST(substr(NEW.value, 1, 2) AS INTEGER) NOT BETWEEN 1 AND 31 THEN
        RAISE(ABORT, 'Geçersiz gün değeri')
      WHEN CAST(substr(NEW.value, 3, 2) AS INTEGER) NOT BETWEEN 0 AND 23 THEN
        RAISE(ABORT, 'Geçersiz saat değeri')
      WHEN CAST(substr(NEW.value, 5, 2) AS INTEGER) NOT BETWEEN 0 AND 59 THEN
        RAISE(ABORT, 'Geçersiz dakika değeri')
      WHEN substr(NEW.value, 7, 1) NOT IN ('C', 'B', 'Z') THEN
        RAISE(ABORT, 'Geçersiz zaman dilimi karakteri')
      WHEN substr(NEW.value, 9, 3) NOT IN (SELECT tr_kisaltma FROM aylar) 
           AND substr(NEW.value, 9, 3) NOT IN (SELECT en_kisaltma FROM aylar) THEN
        RAISE(ABORT, 'Geçersiz ay kısaltması')
    END;
  END;

  -- Mesaj ve Evrak tablosu
  CREATE TABLE IF NOT EXISTS mesaj_evrak (
    -- Base service alanları
    id TEXT PRIMARY KEY,
    is_locked INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
    locked_by TEXT,
    locked_at TEXT,
    updated_at TEXT,
    created_at TEXT NOT NULL,
    computer_name TEXT NOT NULL,
    user_name TEXT NOT NULL,

    -- Mesaj/Evrak spesifik alanlar
    belge_tipi TEXT NOT NULL CHECK (belge_tipi IN ('MESAJ', 'EVRAK')),
    belge_cinsi TEXT NOT NULL CHECK (belge_cinsi IN ('GELEN', 'GİDEN', 'TRANSİT')),
    gonderen_birlik_id TEXT NOT NULL,
    belge_kayit_no INTEGER NOT NULL,
    belge_gün_sira_no INTEGER NOT NULL,
    belge_no TEXT NOT NULL,
    belge_konusu TEXT NOT NULL,
    belge_tarihi TEXT NOT NULL,
    belge_guv_knt_no TEXT,
    belge_gizlilik_id TEXT NOT NULL,
    belge_kategori_id TEXT NOT NULL,
    belge_klasor_id TEXT NOT NULL,
    belge_sayfa_sayisi INTEGER NOT NULL CHECK (belge_sayfa_sayisi > 0),

    -- Foreign key kısıtlamaları
    FOREIGN KEY (gonderen_birlik_id) REFERENCES birlikler(id) ON DELETE RESTRICT,
    FOREIGN KEY (belge_gizlilik_id) REFERENCES gizlilik_dereceleri(id) ON DELETE RESTRICT,
    FOREIGN KEY (belge_kategori_id) REFERENCES kategoriler(id) ON DELETE RESTRICT,
    FOREIGN KEY (belge_klasor_id) REFERENCES klasorler(id) ON DELETE RESTRICT
  );

  -- Güvenlik kodu kontrolü için trigger
  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_guvenlik_kodu_kontrol
  BEFORE INSERT ON mesaj_evrak
  BEGIN
    SELECT
      CASE
        WHEN (
          SELECT guvenlik_kodu_gereklimi 
          FROM gizlilik_dereceleri 
          WHERE id = NEW.belge_gizlilik_id
        ) = 1 
        AND NEW.belge_guv_knt_no IS NULL
        THEN RAISE(ABORT, 'Seçilen gizlilik derecesi için güvenlik kontrol numarası zorunludur')
      END;
  END;

  -- Güvenlik kodu güncelleme kontrolü için trigger
  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_guvenlik_kodu_guncelleme_kontrol
  BEFORE UPDATE OF belge_gizlilik_id ON mesaj_evrak
  FOR EACH ROW
  WHEN NEW.belge_gizlilik_id <> OLD.belge_gizlilik_id
  BEGIN
    SELECT CASE
      WHEN (
        SELECT guvenlik_kodu_gereklimi 
        FROM gizlilik_dereceleri 
        WHERE id = NEW.belge_gizlilik_id
      ) = 1 AND NEW.belge_guv_knt_no IS NULL
      THEN RAISE(ABORT, 'Seçilen gizlilik derecesi için güvenlik kontrol numarası zorunludur')
    END;
  END;

  -- Belge tipi belirleme trigger'ı
  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_belge_tipi_control
  BEFORE INSERT ON mesaj_evrak
  FOR EACH ROW
  BEGIN
    UPDATE mesaj_evrak 
    SET belge_tipi = 
      CASE
        WHEN NEW.belge_tarihi REGEXP '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$' THEN 'EVRAK'
        WHEN NEW.belge_tarihi REGEXP '^[0-9]{6}[CBZ] [A-ZĞÜŞİÖÇ]{3} [0-9]{2}$' THEN 'MESAJ'
        ELSE RAISE(ABORT, 'Geçersiz belge tarihi formatı. Evrak için dd.MM.yyyy, Mesaj için ddHHmmX LLL yy formatı kullanın.')
      END
    WHERE id = NEW.id;
  END;

  -- Kilit mekanizması için trigger'lar
  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_lock_check
  BEFORE UPDATE ON mesaj_evrak
  WHEN NEW.id = OLD.id AND OLD.is_locked = 1 AND 
       (OLD.locked_at IS NOT NULL AND datetime('now') < datetime(OLD.locked_at, '+5 minutes'))
  BEGIN
    SELECT CASE 
      WHEN NEW.locked_by = OLD.locked_by THEN NULL
      ELSE RAISE(ABORT, 'Bu kayıt kilitli')
    END;
  END;

  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_auto_unlock  
  BEFORE UPDATE ON mesaj_evrak
  FOR EACH ROW
  WHEN OLD.is_locked = 1 AND datetime('now') >= datetime(OLD.locked_at, '+5 minutes')
  BEGIN
    UPDATE mesaj_evrak 
    SET is_locked = 0,
        locked_by = NULL,
        locked_at = NULL
    WHERE id = OLD.id;
  END;

  -- İndeksler
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_belge_tipi ON mesaj_evrak(belge_tipi);

  -- Log kayıt trigger'ları
  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_insert_log
  AFTER INSERT ON mesaj_evrak
  BEGIN
    INSERT INTO log_kayitlari (
      islem_turu,
      tablo_adi,
      kayit_id,
      yeni_degerler,
      kullanici_adi,
      bilgisayar_adi,
      islem_tarihi
    ) 
    VALUES (
      'INSERT',
      'mesaj_evrak',
      NEW.id,
      json_object(
        'belge_tipi', NEW.belge_tipi,
        'belge_tarihi', NEW.belge_tarihi,
        'belge_no', NEW.belge_no,
        'belge_konusu', NEW.belge_konusu,
        'gonderen_birlik_id', NEW.gonderen_birlik_id,
        'belge_gizlilik_id', NEW.belge_gizlilik_id
      ),
      NEW.user_name,
      NEW.computer_name,
      datetime('now')
    );
  END;

  CREATE TRIGGER IF NOT EXISTS trg_mesaj_evrak_update_log
  AFTER UPDATE ON mesaj_evrak
  BEGIN
    INSERT INTO log_kayitlari (
      islem_turu,
      tablo_adi, 
      kayit_id,
      eski_degerler,
      yeni_degerler,
      kullanici_adi,
      bilgisayar_adi,
      islem_tarihi
    )
    VALUES (
      'UPDATE',
      'mesaj_evrak',
      OLD.id,
      json_object(
        'belge_tipi', OLD.belge_tipi,
        'belge_tarihi', OLD.belge_tarihi,
        'belge_no', OLD.belge_no,
        'belge_konusu', OLD.belge_konusu,
        'gonderen_birlik_id', OLD.gonderen_birlik_id,
        'belge_gizlilik_id', OLD.belge_gizlilik_id
      ),
      json_object(
        'belge_tipi', NEW.belge_tipi,
        'belge_tarihi', NEW.belge_tarihi,
        'belge_no', NEW.belge_no,
        'belge_konusu', NEW.belge_konusu,
        'gonderen_birlik_id', NEW.gonderen_birlik_id,
        'belge_gizlilik_id', NEW.belge_gizlilik_id
      ),
      NEW.user_name,
      NEW.computer_name,
      datetime('now')
    );
  END;

  -- Diğer indeksler
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_belge_cinsi ON mesaj_evrak(belge_cinsi);
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_gonderen_birlik ON mesaj_evrak(gonderen_birlik_id);
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_belge_tarihi ON mesaj_evrak(belge_tarihi);
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_belge_no ON mesaj_evrak(belge_no);
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_belge_konusu ON mesaj_evrak(belge_konusu);
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_created_at ON mesaj_evrak(created_at);
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_is_locked ON mesaj_evrak(is_locked);
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_gizlilik ON mesaj_evrak(belge_gizlilik_id);
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_kategori ON mesaj_evrak(belge_kategori_id);
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_klasor ON mesaj_evrak(belge_klasor_id);

  -- Hata logları tablosu
  CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    source TEXT,
    user_name TEXT,
    computer_name TEXT,
    additional_info TEXT
  );

  -- Hata logları için indeks
  CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);

  -- Tarih dönüşüm fonksiyonu (Mesaj formatından ISO formatına)
  CREATE VIEW IF NOT EXISTS vw_mesaj_evrak_tarihler AS
  SELECT 
    id,
    belge_tipi,
    belge_tarihi as original_tarih,
    created_at,
    CASE 
      WHEN belge_tipi = 'EVRAK' THEN
        substr(belge_tarihi, 7, 4) || '-' || 
        substr(belge_tarihi, 4, 2) || '-' ||
        substr(belge_tarihi, 1, 2)
      WHEN belge_tipi = 'MESAJ' THEN
        '20' || substr(belge_tarihi, 13, 2) || '-' ||
        CASE substr(belge_tarihi, 9, 3)
          WHEN 'OCA' THEN '01' WHEN 'JAN' THEN '01'
          WHEN 'ŞUB' THEN '02' WHEN 'FEB' THEN '02'
          WHEN 'MAR' THEN '03'
          WHEN 'NİS' THEN '04' WHEN 'APR' THEN '04'
          WHEN 'MAY' THEN '05'
          WHEN 'HAZ' THEN '06' WHEN 'JUN' THEN '06'
          WHEN 'TEM' THEN '07' WHEN 'JUL' THEN '07'
          WHEN 'AĞU' THEN '08' WHEN 'AUG' THEN '08'
          WHEN 'EYL' THEN '09' WHEN 'SEP' THEN '09'
          WHEN 'EKİ' THEN '10' WHEN 'OCT' THEN '10'
          WHEN 'KAS' THEN '11' WHEN 'NOV' THEN '11'
          WHEN 'ARA' THEN '12' WHEN 'DEC' THEN '12'
        END || '-' ||
        substr(belge_tarihi, 1, 2) || ' ' ||
        substr(belge_tarihi, 3, 2) || ':' ||
        substr(belge_tarihi, 5, 2)
    END as normalized_belge_tarihi
  FROM mesaj_evrak;

  -- Tarih aralığında arama view'ı
  CREATE VIEW IF NOT EXISTS vw_mesaj_evrak_by_date AS
  SELECT 
    me.*,
    vt.normalized_belge_tarihi
  FROM mesaj_evrak me
  JOIN vw_mesaj_evrak_tarihler vt ON me.id = vt.id;

  -- Son 24 saat içinde oluşturulan belgeler view'ı
  CREATE VIEW IF NOT EXISTS vw_son_24_saat_belgeler AS
  SELECT *
  FROM vw_mesaj_evrak_by_date
  WHERE datetime(created_at) >= datetime('now', '-24 hours')
  ORDER BY created_at DESC;

  -- Son 1 hafta içinde oluşturulan belgeler view'ı
  CREATE VIEW IF NOT EXISTS vw_son_1_hafta_belgeler AS
  SELECT *
  FROM vw_mesaj_evrak_by_date
  WHERE datetime(created_at) >= datetime('now', '-7 days')
  ORDER BY created_at DESC;

  -- Belirli tarih aralığında belge sayıları view'ı
  CREATE VIEW IF NOT EXISTS vw_belge_istatistikleri AS
  SELECT 
    belge_tipi,
    COUNT(*) as toplam_belge,
    SUM(CASE WHEN datetime(created_at) >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as son_24_saat,
    SUM(CASE WHEN datetime(created_at) >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as son_1_hafta,
    SUM(CASE WHEN datetime(created_at) >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as son_30_gun
  FROM vw_mesaj_evrak_by_date
  GROUP BY belge_tipi;

  -- Belge tarihine göre evrak arama view'ı (dd.MM.yyyy formatı)
  CREATE VIEW IF NOT EXISTS vw_evrak_by_belge_tarihi AS
  SELECT *
  FROM mesaj_evrak
  WHERE belge_tipi = 'EVRAK'
  ORDER BY belge_tarihi ASC;

  -- Belge tarihine göre mesaj arama view'ı (ddHHmmX LLL yy formatı)
  CREATE VIEW IF NOT EXISTS vw_mesaj_by_belge_tarihi AS
  SELECT *
  FROM mesaj_evrak
  WHERE belge_tipi = 'MESAJ'
  ORDER BY belge_tarihi ASC;

  -- Belge tarihine göre tüm belgeler view'ı (tarih aralığı için)
  CREATE VIEW IF NOT EXISTS vw_belgeler_by_tarih_araligi AS
  SELECT 
    *,
    CASE belge_tipi
      WHEN 'EVRAK' THEN 
        -- dd.MM.yyyy -> yyyyMMdd formatına çevir
        substr(belge_tarihi, 7, 4) || substr(belge_tarihi, 4, 2) || substr(belge_tarihi, 1, 2)
      WHEN 'MESAJ' THEN
        -- ddHHmmX LLL yy -> yyyyMMdd formatına çevir
        '20' || substr(belge_tarihi, 13, 2) || 
        CASE substr(belge_tarihi, 9, 3)
          WHEN 'OCA' THEN '01' WHEN 'JAN' THEN '01'
          WHEN 'ŞUB' THEN '02' WHEN 'FEB' THEN '02'
          WHEN 'MAR' THEN '03'
          WHEN 'NİS' THEN '04' WHEN 'APR' THEN '04'
          WHEN 'MAY' THEN '05'
          WHEN 'HAZ' THEN '06' WHEN 'JUN' THEN '06'
          WHEN 'TEM' THEN '07' WHEN 'JUL' THEN '07'
          WHEN 'AĞU' THEN '08' WHEN 'AUG' THEN '08'
          WHEN 'EYL' THEN '09' WHEN 'SEP' THEN '09'
          WHEN 'EKİ' THEN '10' WHEN 'OCT' THEN '10'
          WHEN 'KAS' THEN '11' WHEN 'NOV' THEN '11'
          WHEN 'ARA' THEN '12' WHEN 'DEC' THEN '12'
        END || substr(belge_tarihi, 1, 2)
    END as normalized_date,
    CASE belge_tipi
      WHEN 'EVRAK' THEN 
        date(substr(belge_tarihi, 7, 4) || '-' || substr(belge_tarihi, 4, 2) || '-' || substr(belge_tarihi, 1, 2))
      WHEN 'MESAJ' THEN
        date('20' || substr(belge_tarihi, 13, 2) || '-' || 
        CASE substr(belge_tarihi, 9, 3)
          WHEN 'OCA' THEN '01' WHEN 'JAN' THEN '01'
          WHEN 'ŞUB' THEN '02' WHEN 'FEB' THEN '02'
          WHEN 'MAR' THEN '03'
          WHEN 'NİS' THEN '04' WHEN 'APR' THEN '04'
          WHEN 'MAY' THEN '05'
          WHEN 'HAZ' THEN '06' WHEN 'JUN' THEN '06'
          WHEN 'TEM' THEN '07' WHEN 'JUL' THEN '07'
          WHEN 'AĞU' THEN '08' WHEN 'AUG' THEN '08'
          WHEN 'EYL' THEN '09' WHEN 'SEP' THEN '09'
          WHEN 'EKİ' THEN '10' WHEN 'OCT' THEN '10'
          WHEN 'KAS' THEN '11' WHEN 'NOV' THEN '11'
          WHEN 'ARA' THEN '12' WHEN 'DEC' THEN '12'
        END || '-' || substr(belge_tarihi, 1, 2))
    END as date_for_compare
  FROM mesaj_evrak;

  -- Tarih aralığı için yardımcı fonksiyon
  CREATE VIEW IF NOT EXISTS vw_tarih_araligi_helper AS
  SELECT 
    id,
    belge_tipi,
    belge_tarihi,
    CASE belge_tipi
      WHEN 'EVRAK' THEN 
        date(substr(belge_tarihi, 7, 4) || '-' || substr(belge_tarihi, 4, 2) || '-' || substr(belge_tarihi, 1, 2))
      WHEN 'MESAJ' THEN
        date('20' || substr(belge_tarihi, 13, 2) || '-' || 
        CASE substr(belge_tarihi, 9, 3)
          WHEN 'OCA' THEN '01' WHEN 'JAN' THEN '01'
          WHEN 'ŞUB' THEN '02' WHEN 'FEB' THEN '02'
          WHEN 'MAR' THEN '03'
          WHEN 'NİS' THEN '04' WHEN 'APR' THEN '04'
          WHEN 'MAY' THEN '05'
          WHEN 'HAZ' THEN '06' WHEN 'JUN' THEN '06'
          WHEN 'TEM' THEN '07' WHEN 'JUL' THEN '07'
          WHEN 'AĞU' THEN '08' WHEN 'AUG' THEN '08'
          WHEN 'EYL' THEN '09' WHEN 'SEP' THEN '09'
          WHEN 'EKİ' THEN '10' WHEN 'OCT' THEN '10'
          WHEN 'KAS' THEN '11' WHEN 'NOV' THEN '11'
          WHEN 'ARA' THEN '12' WHEN 'DEC' THEN '12'
        END || '-' || substr(belge_tarihi, 1, 2))
    END as compare_date
  FROM mesaj_evrak;

  -- Oluşturulma tarihine göre belgeler view'ı
  CREATE VIEW IF NOT EXISTS vw_belgeler_by_created_at AS
  SELECT 
    *,
    julianday('now') - julianday(created_at) as gecen_gun
  FROM mesaj_evrak
  ORDER BY created_at DESC;

  -- Belirli bir tarihteki evraklar için index
  CREATE INDEX IF NOT EXISTS idx_evrak_belge_tarihi 
  ON mesaj_evrak(belge_tarihi) 
  WHERE belge_tipi = 'EVRAK';

  -- Belirli bir tarihteki mesajlar için index
  CREATE INDEX IF NOT EXISTS idx_mesaj_belge_tarihi 
  ON mesaj_evrak(belge_tarihi) 
  WHERE belge_tipi = 'MESAJ';

  -- Oluşturulma tarihi için index
  CREATE INDEX IF NOT EXISTS idx_mesaj_evrak_created_at
  ON mesaj_evrak(created_at);

  -- Arama için kapsamlı view
  CREATE VIEW IF NOT EXISTS vw_mesaj_evrak_arama AS
  SELECT 
    me.*,
    b.birlik_adi,
    gd.gizlilik_derecesi as gizlilik_derecesi_adi,
    k.kategori_adi,
    kl.klasor_adi,
    vt.normalized_belge_tarihi,
    CASE 
      WHEN me.belge_tipi = 'MESAJ' THEN 
        me.belge_kayit_no || '/' || me.belge_gün_sira_no || ' - ' || me.belge_no
      ELSE 
        me.belge_kayit_no || '/' || me.belge_gün_sira_no || ' - ' || me.belge_no
    END as belge_tam_no
  FROM mesaj_evrak me
  JOIN vw_mesaj_evrak_tarihler vt ON vt.id = me.id
  JOIN birlikler b ON b.id = me.gonderen_birlik_id
  JOIN gizlilik_dereceleri gd ON gd.id = me.belge_gizlilik_id
  JOIN kategoriler k ON k.id = me.belge_kategori_id
  JOIN klasorler kl ON kl.id = me.belge_klasor_id;
`
