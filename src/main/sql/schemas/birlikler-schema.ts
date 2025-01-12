export const birliklerSchema = `
-- Birlikler tablosu
CREATE TABLE IF NOT EXISTS birlikler (
    -- Base Service Alanları
    id TEXT PRIMARY KEY,                    
    is_locked BOOLEAN NOT NULL DEFAULT 0,   
    locked_by TEXT,                         
    locked_at TEXT,                         
    updated_at TEXT,                        
    created_at TEXT,
    computer_name TEXT NOT NULL,            
    user_name TEXT NOT NULL,                
    
    -- Özel Alanlar
    birlik_adi TEXT NOT NULL,
    birlik_tanitim_kodu TEXT,
    birlik_tipi TEXT NOT NULL CHECK (birlik_tipi IN ('KOMUTANLIK', 'BİRLİK', 'ŞUBE')),
    ust_birlik_id TEXT,
    
    -- Kısıtlamalar
    FOREIGN KEY (ust_birlik_id) REFERENCES birlikler(id) ON DELETE RESTRICT,
    CHECK (
        (locked_by IS NOT NULL AND locked_at IS NOT NULL) OR
        (locked_by IS NULL AND locked_at IS NULL)
    )
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_birlik_locked ON birlikler(is_locked);
CREATE INDEX IF NOT EXISTS idx_birlik_adi ON birlikler(birlik_adi);
CREATE INDEX IF NOT EXISTS idx_birlik_kod ON birlikler(birlik_tanitim_kodu);
CREATE INDEX IF NOT EXISTS idx_birlik_tipi ON birlikler(birlik_tipi);
CREATE INDEX IF NOT EXISTS idx_birlik_ust ON birlikler(ust_birlik_id);
CREATE INDEX IF NOT EXISTS idx_birlik_computer ON birlikler(computer_name, user_name);

-- Üst Birlik ID Kontrolü
CREATE TRIGGER IF NOT EXISTS trg_birlikler_ust_birlik_id_kontrol
AFTER INSERT ON birlikler
FOR EACH ROW
WHEN NEW.ust_birlik_id IS NULL
BEGIN
    UPDATE birlikler 
    SET ust_birlik_id = id
    WHERE id = NEW.id;
END;

-- Türkçe karakter kontrolü için trigger (Üst birlik bazında unique kontrol)
CREATE TRIGGER IF NOT EXISTS trg_birlikler_unique_insert
BEFORE INSERT ON birlikler
BEGIN
    SELECT CASE 
        WHEN NEW.birlik_tanitim_kodu IS NOT NULL AND EXISTS (
            SELECT 1 FROM birlikler 
            WHERE CASE_TURKISH(birlik_tanitim_kodu) = CASE_TURKISH(NEW.birlik_tanitim_kodu)
        )
        THEN RAISE(ABORT, 'Bu birlik tanıtım kodu zaten mevcut')
        WHEN EXISTS (
            SELECT 1 FROM birlikler 
            WHERE CASE_TURKISH(birlik_adi) = CASE_TURKISH(NEW.birlik_adi)
            AND (
                (ust_birlik_id = NEW.ust_birlik_id) OR -- Aynı üst birlikte aynı isim olamaz
                (ust_birlik_id = id) -- Üst birlikler arasında aynı isim olamaz
            )
        )
        THEN RAISE(ABORT, 'Bu birlik adı zaten mevcut')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_birlikler_unique_update
BEFORE UPDATE OF birlik_adi, birlik_tanitim_kodu ON birlikler
BEGIN
    SELECT CASE 
        WHEN NEW.birlik_tanitim_kodu IS NOT NULL AND EXISTS (
            SELECT 1 FROM birlikler 
            WHERE CASE_TURKISH(birlik_tanitim_kodu) = CASE_TURKISH(NEW.birlik_tanitim_kodu)
            AND id != NEW.id
        )
        THEN RAISE(ABORT, 'Bu birlik tanıtım kodu zaten mevcut')
        WHEN EXISTS (
            SELECT 1 FROM birlikler 
            WHERE CASE_TURKISH(birlik_adi) = CASE_TURKISH(NEW.birlik_adi)
            AND id != NEW.id
            AND (
                (ust_birlik_id = NEW.ust_birlik_id) OR -- Aynı üst birlikte aynı isim olamaz
                (ust_birlik_id = id) -- Üst birlikler arasında aynı isim olamaz
            )
        )
        THEN RAISE(ABORT, 'Bu birlik adı zaten mevcut')
    END;
END;

-- Kilit Kontrol
CREATE TRIGGER IF NOT EXISTS trg_birlikler_kilit_kontrol
BEFORE UPDATE ON birlikler
FOR EACH ROW
WHEN NEW.is_locked = 0 AND OLD.is_locked = 1
BEGIN
    SELECT CASE 
        WHEN OLD.locked_by != NEW.locked_by AND
             datetime(OLD.locked_at, '+5 minutes') > datetime('now')
        THEN RAISE(ABORT, 'Kayıt başka bir kullanıcı tarafından kilitlenmiş ve kilit süresi dolmamış')
    END;
END;

-- Otomatik Kilit Açma Trigger
CREATE TRIGGER IF NOT EXISTS trg_birlikler_kilit_kontrol_sure
BEFORE UPDATE ON birlikler
FOR EACH ROW
WHEN OLD.is_locked = 1 AND 
     datetime(OLD.locked_at, '+5 minutes') <= datetime('now')
BEGIN
    SELECT CASE 
        WHEN NEW.is_locked = 1
        THEN RAISE(ABORT, 'Kilit süresi dolmuş, yeni kilit için önce kilidi kaldırın')
    END;
END;

-- Üst Birlik Silme Kontrolü
CREATE TRIGGER IF NOT EXISTS trg_birlikler_ust_birlik_silme_kontrol
BEFORE DELETE ON birlikler
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM birlikler 
            WHERE ust_birlik_id = OLD.id
            AND id != OLD.id  -- Kendi kendine referans durumunu kontrol etme
        )
        THEN RAISE(ABORT, 'Bu birliğin alt birlikleri var, önce alt birlikleri silmelisiniz')
    END;
END;

-- Üst Birlik Döngü Kontrolü
CREATE TRIGGER IF NOT EXISTS trg_birlikler_ust_birlik_dongu_kontrol
BEFORE INSERT ON birlikler
WHEN NEW.ust_birlik_id IS NOT NULL AND NEW.ust_birlik_id != NEW.id
BEGIN
    WITH RECURSIVE ust_birlikler(id) AS (
        SELECT NEW.ust_birlik_id
        UNION ALL
        SELECT b.ust_birlik_id
        FROM birlikler b
        INNER JOIN ust_birlikler u ON b.id = u.id
        WHERE b.ust_birlik_id IS NOT NULL
        AND b.ust_birlik_id != b.id
    )
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM ust_birlikler 
            WHERE id = NEW.id
        )
        THEN RAISE(ABORT, 'Döngüsel birlik hiyerarşisi oluşturulamaz')
    END;
END;`
