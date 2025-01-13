export const dagitimSchema = `
  -- Dağıtım tablosu
  CREATE TABLE IF NOT EXISTS dagitim (
    -- Base service alanları
    id TEXT PRIMARY KEY,
    is_locked INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
    locked_by TEXT,
    locked_at TEXT,
    updated_at TEXT,
    created_at TEXT NOT NULL,
    computer_name TEXT NOT NULL,
    user_name TEXT NOT NULL,

    -- Dağıtım spesifik alanlar
    birlik_id TEXT NOT NULL,
    ust_birlik_id TEXT NOT NULL,
    dagitim_tarihi TEXT NOT NULL,
    mesaj_evrak_id TEXT NOT NULL,
    kanal_id TEXT NOT NULL,
    belge_guv_knt_no TEXT,
    teslim_durumu INTEGER NOT NULL DEFAULT 0 CHECK (teslim_durumu IN (0, 1)),
    senet_no INTEGER,
    teslim_tarihi TEXT,

    -- Foreign key kısıtlamaları
    FOREIGN KEY (birlik_id) REFERENCES birlikler(id) ON DELETE RESTRICT,
    FOREIGN KEY (ust_birlik_id) REFERENCES birlikler(id) ON DELETE RESTRICT,
    FOREIGN KEY (mesaj_evrak_id) REFERENCES mesaj_evrak(id) ON DELETE RESTRICT,
    FOREIGN KEY (kanal_id) REFERENCES kanallar(id) ON DELETE RESTRICT,

    -- Kısıtlamalar
    CHECK (
      (locked_by IS NOT NULL AND locked_at IS NOT NULL) OR
      (locked_by IS NULL AND locked_at IS NULL)
    )
  );

  -- İndeksler
  CREATE INDEX IF NOT EXISTS idx_dagitim_birlik ON dagitim(birlik_id);
  CREATE INDEX IF NOT EXISTS idx_dagitim_ust_birlik ON dagitim(ust_birlik_id);
  CREATE INDEX IF NOT EXISTS idx_dagitim_mesaj_evrak ON dagitim(mesaj_evrak_id);
  CREATE INDEX IF NOT EXISTS idx_dagitim_kanal ON dagitim(kanal_id);
  CREATE INDEX IF NOT EXISTS idx_dagitim_teslim_durumu ON dagitim(teslim_durumu);
  CREATE INDEX IF NOT EXISTS idx_dagitim_dagitim_tarihi ON dagitim(dagitim_tarihi);
  CREATE INDEX IF NOT EXISTS idx_dagitim_teslim_tarihi ON dagitim(teslim_tarihi);
  CREATE INDEX IF NOT EXISTS idx_dagitim_senet_no ON dagitim(senet_no);
  CREATE INDEX IF NOT EXISTS idx_dagitim_is_locked ON dagitim(is_locked);

  -- Güvenlik kodu kontrolü için trigger
  CREATE TRIGGER IF NOT EXISTS trg_dagitim_guvenlik_kodu_kontrol
  BEFORE INSERT ON dagitim
  BEGIN
    SELECT
      CASE
        -- EVRAK kontrolü
        WHEN EXISTS (
          SELECT 1 
          FROM mesaj_evrak me
          WHERE me.id = NEW.mesaj_evrak_id
          AND me.belge_tipi = 'EVRAK'
          AND me.belge_guv_knt_no IS NOT NULL
          AND NEW.belge_guv_knt_no IS NULL
        )
        THEN RAISE(ABORT, 'Evrakta güvenlik kontrol numarası olduğu için dağıtımda da girilmesi zorunludur')

        -- GİDEN EVRAK için farklı numara kontrolü
        WHEN EXISTS (
          SELECT 1 
          FROM mesaj_evrak me
          WHERE me.id = NEW.mesaj_evrak_id
          AND me.belge_tipi = 'EVRAK'
          AND me.belge_cinsi = 'GİDEN'
          AND me.belge_guv_knt_no IS NOT NULL
          AND me.belge_guv_knt_no = NEW.belge_guv_knt_no
        )
        THEN RAISE(ABORT, 'GİDEN evraklar için orijinal evraktan farklı bir güvenlik kontrol numarası girilmelidir')
      END;
  END;

  -- Kilit mekanizması için trigger'lar
  CREATE TRIGGER IF NOT EXISTS trg_dagitim_lock_check
  BEFORE UPDATE ON dagitim
  WHEN NEW.id = OLD.id AND OLD.is_locked = 1 AND 
       (OLD.locked_at IS NOT NULL AND datetime('now') < datetime(OLD.locked_at, '+5 minutes'))
  BEGIN
    SELECT CASE 
      WHEN NEW.locked_by = OLD.locked_by THEN NULL
      ELSE RAISE(ABORT, 'Bu kayıt kilitli')
    END;
  END;

  CREATE TRIGGER IF NOT EXISTS trg_dagitim_auto_unlock  
  BEFORE UPDATE ON dagitim
  FOR EACH ROW
  WHEN OLD.is_locked = 1 AND datetime('now') >= datetime(OLD.locked_at, '+5 minutes')
  BEGIN
    UPDATE dagitim 
    SET is_locked = 0,
        locked_by = NULL,
        locked_at = NULL
    WHERE id = OLD.id;
  END;

  -- Belge güvenlik kodu kontrolü için trigger (GELEN veya TRANSİT ise mesajdakiyle aynı olmalı)
  CREATE TRIGGER IF NOT EXISTS trg_dagitim_belge_guv_knt_no_kontrol
  BEFORE INSERT ON dagitim
  BEGIN
    SELECT
      CASE
        WHEN EXISTS (
          SELECT 1 
          FROM mesaj_evrak me
          WHERE me.id = NEW.mesaj_evrak_id
          AND me.belge_cinsi IN ('GELEN', 'TRANSİT')
          AND me.belge_guv_knt_no != NEW.belge_guv_knt_no
        )
        THEN RAISE(ABORT, 'GELEN veya TRANSİT belgelerde güvenlik kontrol numarası mesajdakiyle aynı olmalıdır')
      END;
  END;

  -- POSTA kanalı kontrolü için trigger
  CREATE TRIGGER IF NOT EXISTS trg_dagitim_delete_control
  BEFORE DELETE ON dagitim
  FOR EACH ROW
  BEGIN
      SELECT CASE
          WHEN EXISTS (
              SELECT 1 FROM kanallar k
              WHERE k.id = OLD.kanal_id 
              AND k.kanal = 'POSTA'
          ) THEN
              RAISE(ABORT, 'POSTA kanalı ile dağıtılmış kayıtlar, önce posta kayıtları silinmeden silinemez.')
      END;
  END;

  -- Dağıtım view'ı
  CREATE VIEW IF NOT EXISTS vw_dagitim AS
  SELECT 
    d.*,
    b.birlik_adi,
    ub.birlik_adi as ust_birlik_adi,
    me.belge_no,
    me.belge_konusu,
    me.belge_cinsi,
    me.belge_tipi,
    k.kanal as kanal_adi,
    CASE 
      WHEN me.belge_tipi = 'MESAJ' THEN 
        me.belge_kayit_no || '/' || me.belge_gün_sira_no || ' - ' || me.belge_no
      ELSE 
        me.belge_kayit_no || '/' || me.belge_gün_sira_no || ' - ' || me.belge_no
    END as belge_tam_no
  FROM dagitim d
  LEFT JOIN birlikler b ON d.birlik_id = b.id
  LEFT JOIN birlikler ub ON d.ust_birlik_id = ub.id
  LEFT JOIN mesaj_evrak me ON d.mesaj_evrak_id = me.id
  LEFT JOIN kanallar k ON d.kanal_id = k.id;

  -- Son 24 saat içindeki dağıtımlar view'ı
  CREATE VIEW IF NOT EXISTS vw_son_24_saat_dagitimlar AS
  SELECT *
  FROM vw_dagitim
  WHERE datetime(created_at) >= datetime('now', '-24 hours')
  ORDER BY created_at DESC;

  -- Teslim edilmemiş dağıtımlar view'ı
  CREATE VIEW IF NOT EXISTS vw_teslim_edilmemis_dagitimlar AS
  SELECT *
  FROM vw_dagitim
  WHERE teslim_durumu = 0
  ORDER BY dagitim_tarihi ASC;

  -- Dağıtım istatistikleri view'ı
  CREATE VIEW IF NOT EXISTS vw_dagitim_istatistikleri AS
  SELECT 
    COUNT(*) as toplam_dagitim,
    SUM(CASE WHEN teslim_durumu = 1 THEN 1 ELSE 0 END) as teslim_edilen,
    SUM(CASE WHEN teslim_durumu = 0 THEN 1 ELSE 0 END) as teslim_edilmeyen,
    SUM(CASE WHEN datetime(created_at) >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as son_24_saat,
    SUM(CASE WHEN datetime(created_at) >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as son_1_hafta
  FROM dagitim;

  -- Dağıtım detay view'ı
  CREATE VIEW IF NOT EXISTS v_dagitim_detay AS
  SELECT 
      d.id as dagitim_id,
      d.mesaj_evrak_id,
      d.ust_birlik_id,
      d.birlik_id,
      d.kanal_id,
      d.teslim_durumu,
      d.teslim_tarihi,
      d.dagitim_tarihi,
      d.belge_guv_knt_no,
      d.senet_no,
      me.belge_tipi,
      me.belge_cinsi,
      me.belge_no,
      me.belge_konusu,
      me.belge_tarihi,
      ub.birlik_adi as ust_birlik_adi,
      b.birlik_adi as birlik_adi,
      k.kanal as kanal_adi
  FROM dagitim d
  INNER JOIN mesaj_evrak me ON d.mesaj_evrak_id = me.id
  INNER JOIN birlikler ub ON d.ust_birlik_id = ub.id
  INNER JOIN birlikler b ON d.birlik_id = b.id
  INNER JOIN kanallar k ON d.kanal_id = k.id;

  -- Teslim edilmemiş dağıtımların özet view'ı
  CREATE VIEW IF NOT EXISTS v_teslim_edilmemis_dagitimlar AS
  SELECT 
      d.ust_birlik_id,
      ub.birlik_adi as ust_birlik_adi,
      COUNT(DISTINCT d.mesaj_evrak_id) as bekleyen_evrak_sayisi,
      GROUP_CONCAT(DISTINCT d.mesaj_evrak_id) as mesaj_evrak_idler
  FROM dagitim d
  INNER JOIN birlikler ub ON d.ust_birlik_id = ub.id
  WHERE d.teslim_durumu = 0
  GROUP BY d.ust_birlik_id, ub.birlik_adi;

  -- Üst birlik bazında dağıtım detay view'ı
  CREATE VIEW IF NOT EXISTS v_ust_birlik_dagitim_detay AS
  SELECT 
      d.ust_birlik_id,
      ub.birlik_adi as ust_birlik_adi,
      d.mesaj_evrak_id,
      me.belge_tipi,
      me.belge_cinsi,
      me.belge_no,
      me.belge_konusu,
      me.belge_tarihi,
      COUNT(d.id) as dagitim_sayisi,
      SUM(CASE WHEN d.teslim_durumu = 1 THEN 1 ELSE 0 END) as teslim_edilen,
      SUM(CASE WHEN d.teslim_durumu = 0 THEN 1 ELSE 0 END) as teslim_edilmeyen,
      GROUP_CONCAT(
          CASE 
              WHEN d.birlik_id = d.ust_birlik_id THEN 'Kendisi'
              ELSE b.birlik_adi 
          END
      ) as dagitilan_birlikler
  FROM dagitim d
  INNER JOIN mesaj_evrak me ON d.mesaj_evrak_id = me.id
  INNER JOIN birlikler ub ON d.ust_birlik_id = ub.id
  INNER JOIN birlikler b ON d.birlik_id = b.id
  GROUP BY 
      d.ust_birlik_id,
      ub.birlik_adi,
      d.mesaj_evrak_id,
      me.belge_tipi,
      me.belge_cinsi,
      me.belge_no,
      me.belge_konusu,
      me.belge_tarihi;

  -- En son senet numaralarını gösteren view
  CREATE VIEW IF NOT EXISTS v_son_senet_no AS
  SELECT 
      CAST(senet_no/10000 as INTEGER) as yil,
      MAX(senet_no) as son_senet_no,
      COUNT(*) as senet_adedi
  FROM dagitim 
  WHERE senet_no > 0
  GROUP BY CAST(senet_no/10000 as INTEGER)
  ORDER BY yil DESC;

  -- Senet detaylarını gösteren view
  CREATE VIEW IF NOT EXISTS v_senet_detay AS
  SELECT 
      d.senet_no,
      d.teslim_tarihi,
      COUNT(*) as evrak_sayisi,
      GROUP_CONCAT(DISTINCT me.belge_no) as evrak_nolar,
      GROUP_CONCAT(DISTINCT b.birlik_adi) as teslim_edilen_birlikler
  FROM dagitim d
  INNER JOIN mesaj_evrak me ON d.mesaj_evrak_id = me.id
  INNER JOIN birlikler b ON d.birlik_id = b.id
  WHERE d.senet_no > 0
  GROUP BY d.senet_no, d.teslim_tarihi
  ORDER BY d.senet_no DESC;

  -- Kanal değişikliği trigger'ı
  CREATE TRIGGER IF NOT EXISTS trg_kanal_degisikligi
  AFTER UPDATE OF kanal_id ON dagitim
  WHEN OLD.kanal_id != NEW.kanal_id
  BEGIN
      UPDATE dagitim 
      SET teslim_tarihi = datetime('now'),
          senet_no = 0,
          teslim_durumu = 1
      WHERE id = NEW.id;
  END;

  -- Silme kontrolü için trigger
  CREATE TRIGGER IF NOT EXISTS trg_dagitim_silme_kontrol
  BEFORE DELETE ON dagitim
  BEGIN
      SELECT CASE
          WHEN (
              SELECT teslim_durumu 
              FROM dagitim 
              WHERE id = OLD.id
          ) = 1 
          THEN RAISE(ABORT, 'Teslim edilmiş dağıtım silinemez')
          
          WHEN (
              SELECT senet_no 
              FROM dagitim 
              WHERE id = OLD.id AND senet_no > 0
          ) IS NOT NULL 
          THEN RAISE(ABORT, 'Senet numarası verilmiş dağıtım silinemez')
          
          WHEN (
              SELECT is_locked 
              FROM dagitim 
              WHERE id = OLD.id
          ) = 1 
          THEN RAISE(ABORT, 'Kilitli dağıtım silinemez')
      END;
  END;
`
