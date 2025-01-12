export const sayacSchema = `
  -- Sayaç tablosu
  CREATE TABLE IF NOT EXISTS sayac (
    -- Base service alanları
    id TEXT PRIMARY KEY,
    is_locked INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
    locked_by TEXT,
    locked_at TEXT,
    updated_at TEXT,
    created_at TEXT NOT NULL,
    computer_name TEXT NOT NULL,
    user_name TEXT NOT NULL,

    -- Sayaç spesifik alanlar
    belge_cinsi TEXT NOT NULL CHECK (belge_cinsi IN ('GELEN', 'GİDEN', 'TRANSİT')),
    yil TEXT NOT NULL,                    -- YYYY formatında
    son_kayit_no INTEGER NOT NULL,        -- O yıl için son belge kayıt no
    gun TEXT NOT NULL,                    -- YYYY-MM-DD formatında
    son_gun_sira_no INTEGER NOT NULL,     -- O gün için son sıra no
    son_islem TEXT,                       -- Son işlem tarihi (sayaç artırma için)

    -- Kısıtlamalar
    CHECK (
      (locked_by IS NOT NULL AND locked_at IS NOT NULL) OR
      (locked_by IS NULL AND locked_at IS NULL)
    ),
    CHECK (yil REGEXP '^[0-9]{4}$'),
    CHECK (gun REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
    UNIQUE(belge_cinsi, yil),
    UNIQUE(belge_cinsi, gun)
  );

  -- İndeksler
  CREATE INDEX IF NOT EXISTS idx_sayac_belge_cinsi ON sayac(belge_cinsi);
  CREATE INDEX IF NOT EXISTS idx_sayac_yil ON sayac(yil);
  CREATE INDEX IF NOT EXISTS idx_sayac_gun ON sayac(gun);
  CREATE INDEX IF NOT EXISTS idx_sayac_locked ON sayac(is_locked);
  CREATE INDEX IF NOT EXISTS idx_sayac_computer ON sayac(computer_name, user_name);

  -- Kilit Kontrol
  CREATE TRIGGER IF NOT EXISTS trg_sayac_kilit_kontrol
  BEFORE UPDATE ON sayac
  FOR EACH ROW
  WHEN NEW.is_locked = 0 AND OLD.is_locked = 1
  BEGIN
    SELECT CASE 
      WHEN OLD.locked_by != NEW.locked_by AND
           datetime(OLD.locked_at, '+5 minutes') > datetime('now')
      THEN RAISE(ABORT, 'Kayıt başka bir kullanıcı tarafından kilitlenmiş ve kilit süresi dolmamış')
    END;
  END;

  -- Otomatik Kilit Açma
  CREATE TRIGGER IF NOT EXISTS trg_sayac_kilit_kontrol_sure
  BEFORE UPDATE ON sayac
  FOR EACH ROW
  WHEN OLD.is_locked = 1 AND 
       datetime(OLD.locked_at, '+5 minutes') <= datetime('now')
  BEGIN
    SELECT CASE 
      WHEN NEW.is_locked = 1
      THEN RAISE(ABORT, 'Kilit süresi dolmuş, yeni kilit için önce kilidi kaldırın')
    END;
  END;

  -- Yeni gün başladığında sıra no sıfırlama
  CREATE TRIGGER IF NOT EXISTS trg_sayac_yeni_gun
  BEFORE UPDATE ON sayac
  FOR EACH ROW
  WHEN NEW.gun != OLD.gun
  BEGIN
    UPDATE sayac 
    SET son_gun_sira_no = 0
    WHERE id = NEW.id;
  END;

  -- Yeni yıl başladığında kayıt no sıfırlama
  CREATE TRIGGER IF NOT EXISTS trg_sayac_yeni_yil
  BEFORE UPDATE ON sayac
  FOR EACH ROW
  WHEN NEW.yil != OLD.yil
  BEGIN
    UPDATE sayac 
    SET son_kayit_no = 0
    WHERE id = NEW.id;
  END;

  -- Kayıt numarası artırma trigger'ı
  CREATE TRIGGER IF NOT EXISTS trg_sayac_kayit_no_artir
  BEFORE UPDATE OF son_kayit_no ON sayac
  FOR EACH ROW
  BEGIN
    SELECT CASE
      WHEN NEW.son_kayit_no <= OLD.son_kayit_no
      THEN RAISE(ABORT, 'Kayıt numarası küçültülemez')
      WHEN NEW.son_kayit_no > OLD.son_kayit_no + 1
      THEN RAISE(ABORT, 'Kayıt numarası sadece 1 artırılabilir')
    END;
  END;

  -- Gün sıra numarası artırma trigger'ı
  CREATE TRIGGER IF NOT EXISTS trg_sayac_gun_sira_no_artir
  BEFORE UPDATE OF son_gun_sira_no ON sayac
  FOR EACH ROW
  BEGIN
    SELECT CASE
      WHEN NEW.son_gun_sira_no <= OLD.son_gun_sira_no
      THEN RAISE(ABORT, 'Gün sıra numarası küçültülemez')
      WHEN NEW.son_gun_sira_no > OLD.son_gun_sira_no + 1
      THEN RAISE(ABORT, 'Gün sıra numarası sadece 1 artırılabilir')
    END;
  END;

  -- Yeni kayıt için varsayılan değerler trigger'ı
  CREATE TRIGGER IF NOT EXISTS trg_sayac_yeni_kayit
  AFTER INSERT ON sayac
  BEGIN
    UPDATE sayac 
    SET son_kayit_no = COALESCE(
          (
            SELECT MAX(son_kayit_no)
            FROM sayac
            WHERE belge_cinsi = NEW.belge_cinsi
            AND yil = NEW.yil
            AND id != NEW.id
          ), 0
        ) + 1,
        son_gun_sira_no = COALESCE(
          (
            SELECT MAX(son_gun_sira_no)
            FROM sayac
            WHERE belge_cinsi = NEW.belge_cinsi
            AND gun = NEW.gun
            AND id != NEW.id
          ), 0
        ) + 1,
        son_islem = datetime('now')
    WHERE id = NEW.id;
  END;

  -- Sayaç artırma trigger'ı
  CREATE TRIGGER IF NOT EXISTS trg_sayac_artir
  BEFORE UPDATE ON sayac
  FOR EACH ROW
  WHEN NEW.son_islem != OLD.son_islem
  BEGIN
    UPDATE sayac 
    SET son_kayit_no = son_kayit_no + 1,
        son_gun_sira_no = son_gun_sira_no + 1,
        updated_at = datetime('now')
    WHERE id = NEW.id;
  END;

  -- Sayaç istatistikleri view'ı
  CREATE VIEW IF NOT EXISTS vw_sayac_istatistikleri AS
  SELECT 
    belge_cinsi,
    yil,
    son_kayit_no as yillik_toplam,
    gun,
    son_gun_sira_no as gunluk_toplam,
    created_at,
    updated_at,
    computer_name,
    user_name
  FROM sayac
  ORDER BY yil DESC, gun DESC;
`
