export const gizlilikDereceleriSchema = `
-- Gizlilik Dereceleri tablosu
CREATE TABLE IF NOT EXISTS gizlilik_dereceleri (
    -- Base Service Alanları
    id TEXT PRIMARY KEY,                    
    is_locked BOOLEAN NOT NULL DEFAULT 0,   
    locked_by TEXT,                         
    locked_at TEXT,                         
    updated_at TEXT,                        
    created_at TEXT,
    computer_name TEXT NOT NULL,            
    user_name TEXT NOT NULL,                
    
    -- Referans Ortak Alanları
    varsayılan BOOLEAN NOT NULL DEFAULT 0,  
    
    -- Özel Alanlar
    gizlilik_derecesi TEXT NOT NULL,
    guvenlik_kodu_gereklimi BOOLEAN NOT NULL DEFAULT 0,
    
    -- Kısıtlamalar
    CHECK (
        (locked_by IS NOT NULL AND locked_at IS NOT NULL) OR
        (locked_by IS NULL AND locked_at IS NULL)
    )
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_gizlilik_varsayılan ON gizlilik_dereceleri(varsayılan);
CREATE INDEX IF NOT EXISTS idx_gizlilik_locked ON gizlilik_dereceleri(is_locked);
CREATE INDEX IF NOT EXISTS idx_gizlilik_derecesi ON gizlilik_dereceleri(gizlilik_derecesi);
CREATE INDEX IF NOT EXISTS idx_gizlilik_computer ON gizlilik_dereceleri(computer_name, user_name);

-- Türkçe karakter kontrolü için trigger
CREATE TRIGGER IF NOT EXISTS trg_gizlilik_dereceleri_unique_insert
BEFORE INSERT ON gizlilik_dereceleri
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM gizlilik_dereceleri 
            WHERE CASE_TURKISH(gizlilik_derecesi) = CASE_TURKISH(NEW.gizlilik_derecesi)
        )
        THEN RAISE(ABORT, 'Bu gizlilik derecesi zaten mevcut')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_gizlilik_dereceleri_unique_update
BEFORE UPDATE OF gizlilik_derecesi ON gizlilik_dereceleri
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM gizlilik_dereceleri 
            WHERE CASE_TURKISH(gizlilik_derecesi) = CASE_TURKISH(NEW.gizlilik_derecesi)
            AND id != NEW.id
        )
        THEN RAISE(ABORT, 'Bu gizlilik derecesi zaten mevcut')
    END;
END;

-- Gizlilik Dereceleri için Varsayılan Kontrol Trigger'ları
CREATE TRIGGER IF NOT EXISTS trg_gizlilik_dereceleri_varsayılan_insert
AFTER INSERT ON gizlilik_dereceleri
BEGIN
    UPDATE gizlilik_dereceleri 
    SET varsayılan = 0 
    WHERE id != NEW.id AND varsayılan = 1 AND NEW.varsayılan = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_gizlilik_dereceleri_varsayılan_update
AFTER UPDATE OF varsayılan ON gizlilik_dereceleri
WHEN NEW.varsayılan = 1 AND OLD.varsayılan = 0
BEGIN
    UPDATE gizlilik_dereceleri 
    SET varsayılan = 0 
    WHERE id != NEW.id AND varsayılan = 1;
END;

-- Kilit Kontrol
CREATE TRIGGER IF NOT EXISTS trg_gizlilik_dereceleri_kilit_kontrol
BEFORE UPDATE ON gizlilik_dereceleri
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
CREATE TRIGGER IF NOT EXISTS trg_gizlilik_dereceleri_kilit_kontrol_sure
BEFORE UPDATE ON gizlilik_dereceleri
FOR EACH ROW
WHEN OLD.is_locked = 1 AND 
     datetime(OLD.locked_at, '+5 minutes') <= datetime('now')
BEGIN
    SELECT CASE 
        WHEN NEW.is_locked = 1
        THEN RAISE(ABORT, 'Kilit süresi dolmuş, yeni kilit için önce kilidi kaldırın')
    END;
END;

-- Silme Kontrolü
CREATE TRIGGER IF NOT EXISTS trg_gizlilik_dereceleri_delete_control
BEFORE DELETE ON gizlilik_dereceleri
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM mesaj_evrak 
            WHERE belge_gizlilik_id = OLD.id
        )
        THEN RAISE(ABORT, 'Bu gizlilik derecesi mesaj/evraklarda kullanıldığı için silinemez')
    END;
END;`

export const klasorlerSchema = `
-- Klasörler tablosu
CREATE TABLE IF NOT EXISTS klasorler (
    -- Base Service Alanları
    id TEXT PRIMARY KEY,
    is_locked BOOLEAN NOT NULL DEFAULT 0,
    locked_by TEXT,
    locked_at TEXT,
    updated_at TEXT,
    created_at TEXT,
    computer_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    
    -- Referans Ortak Alanları
    varsayılan BOOLEAN NOT NULL DEFAULT 0,
    
    -- Özel Alanlar
    klasor TEXT NOT NULL,

    -- Kısıtlamalar
    CHECK (
        (locked_by IS NOT NULL AND locked_at IS NOT NULL) OR
        (locked_by IS NULL AND locked_at IS NULL)
    )
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_klasor_varsayılan ON klasorler(varsayılan);
CREATE INDEX IF NOT EXISTS idx_klasor_locked ON klasorler(is_locked);
CREATE INDEX IF NOT EXISTS idx_klasor_ad ON klasorler(klasor);
CREATE INDEX IF NOT EXISTS idx_klasor_computer ON klasorler(computer_name, user_name);

-- Türkçe karakter kontrolü için trigger
CREATE TRIGGER IF NOT EXISTS trg_klasorler_unique_insert
BEFORE INSERT ON klasorler
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM klasorler 
            WHERE CASE_TURKISH(klasor) = CASE_TURKISH(NEW.klasor)
        )
        THEN RAISE(ABORT, 'Bu klasör adı zaten mevcut')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_klasorler_unique_update
BEFORE UPDATE OF klasor ON klasorler
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM klasorler 
            WHERE CASE_TURKISH(klasor) = CASE_TURKISH(NEW.klasor)
            AND id != NEW.id
        )
        THEN RAISE(ABORT, 'Bu klasör adı zaten mevcut')
    END;
END;

-- Klasörler için Varsayılan Kontrol Trigger'ları
CREATE TRIGGER IF NOT EXISTS trg_klasorler_varsayılan_insert
AFTER INSERT ON klasorler
BEGIN
    UPDATE klasorler 
    SET varsayılan = 0 
    WHERE id != NEW.id AND varsayılan = 1 AND NEW.varsayılan = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_klasorler_varsayılan_update
AFTER UPDATE OF varsayılan ON klasorler
WHEN NEW.varsayılan = 1 AND OLD.varsayılan = 0
BEGIN
    UPDATE klasorler 
    SET varsayılan = 0 
    WHERE id != NEW.id AND varsayılan = 1;
END;

-- Kilit Kontrol
CREATE TRIGGER IF NOT EXISTS trg_klasorler_kilit_kontrol
BEFORE UPDATE ON klasorler
FOR EACH ROW
WHEN NEW.is_locked = 0 AND OLD.is_locked = 1
BEGIN
    SELECT CASE 
        WHEN OLD.locked_by != NEW.locked_by 
        THEN RAISE(ABORT, 'Kayıt başka bir kullanıcı tarafından kilitlenmiş')
    END;
END;

-- Silme Kontrolü
CREATE TRIGGER IF NOT EXISTS trg_klasorler_delete_control
BEFORE DELETE ON klasorler
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM mesaj_evrak 
            WHERE belge_klasor_id = OLD.id
        )
        THEN RAISE(ABORT, 'Bu klasör mesaj/evraklarda kullanıldığı için silinemez')
    END;
END;`

export const kategorilerSchema = `
-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS kategoriler (
    -- Base Service Alanları
    id TEXT PRIMARY KEY,
    is_locked BOOLEAN NOT NULL DEFAULT 0,
    locked_by TEXT,
    locked_at TEXT,
    updated_at TEXT,
    created_at TEXT,
    computer_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    
    -- Referans Ortak Alanları
    varsayılan BOOLEAN NOT NULL DEFAULT 0,
    
    -- Özel Alanlar
    kategori TEXT NOT NULL,
    
    -- Kısıtlamalar
    CHECK (
        (locked_by IS NOT NULL AND locked_at IS NOT NULL) OR
        (locked_by IS NULL AND locked_at IS NULL)
    )
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_kategori_varsayılan ON kategoriler(varsayılan);
CREATE INDEX IF NOT EXISTS idx_kategori_locked ON kategoriler(is_locked);
CREATE INDEX IF NOT EXISTS idx_kategori_ad ON kategoriler(kategori);
CREATE INDEX IF NOT EXISTS idx_kategori_computer ON kategoriler(computer_name, user_name);

-- Türkçe karakter kontrolü için trigger
CREATE TRIGGER IF NOT EXISTS trg_kategoriler_unique_insert
BEFORE INSERT ON kategoriler
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM kategoriler 
            WHERE CASE_TURKISH(kategori) = CASE_TURKISH(NEW.kategori)
        )
        THEN RAISE(ABORT, 'Bu kategori adı zaten mevcut')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_kategoriler_unique_update
BEFORE UPDATE OF kategori ON kategoriler
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM kategoriler 
            WHERE CASE_TURKISH(kategori) = CASE_TURKISH(NEW.kategori)
            AND id != NEW.id
        )
        THEN RAISE(ABORT, 'Bu kategori adı zaten mevcut')
    END;
END;

-- Kategoriler için Varsayılan Kontrol Trigger'ları
CREATE TRIGGER IF NOT EXISTS trg_kategoriler_varsayılan_insert
AFTER INSERT ON kategoriler
BEGIN
    UPDATE kategoriler 
    SET varsayılan = 0 
    WHERE id != NEW.id AND varsayılan = 1 AND NEW.varsayılan = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_kategoriler_varsayılan_update
AFTER UPDATE OF varsayılan ON kategoriler
WHEN NEW.varsayılan = 1 AND OLD.varsayılan = 0
BEGIN
    UPDATE kategoriler 
    SET varsayılan = 0 
    WHERE id != NEW.id AND varsayılan = 1;
END;

-- Kilit Kontrol
CREATE TRIGGER IF NOT EXISTS trg_kategoriler_kilit_kontrol
BEFORE UPDATE ON kategoriler
FOR EACH ROW
WHEN NEW.is_locked = 0 AND OLD.is_locked = 1
BEGIN
    SELECT CASE 
        WHEN OLD.locked_by != NEW.locked_by 
        THEN RAISE(ABORT, 'Kayıt başka bir kullanıcı tarafından kilitlenmiş')
    END;
END;

-- Silme Kontrolü
CREATE TRIGGER IF NOT EXISTS trg_kategoriler_delete_control
BEFORE DELETE ON kategoriler
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM mesaj_evrak 
            WHERE belge_kategori_id = OLD.id
        )
        THEN RAISE(ABORT, 'Bu kategori mesaj/evraklarda kullanıldığı için silinemez')
    END;
END;`

export const kanallarSchema = `
-- Kanallar tablosu
CREATE TABLE IF NOT EXISTS kanallar (
    -- Base Service Alanları
    id TEXT PRIMARY KEY,
    is_locked BOOLEAN NOT NULL DEFAULT 0,
    locked_by TEXT,
    locked_at TEXT,
    updated_at TEXT,
    created_at TEXT,
    computer_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    
    -- Referans Ortak Alanları
    varsayılan BOOLEAN NOT NULL DEFAULT 0,
    
    -- Özel Alanlar
    kanal TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT 0, -- Sistem tarafından oluşturulan kayıtlar (KURYE, POSTA)
    
    -- Kısıtlamalar
    CHECK (
        (locked_by IS NOT NULL AND locked_at IS NOT NULL) OR
        (locked_by IS NULL AND locked_at IS NULL)
    )
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_kanal_varsayılan ON kanallar(varsayılan);
CREATE INDEX IF NOT EXISTS idx_kanal_locked ON kanallar(is_locked);
CREATE INDEX IF NOT EXISTS idx_kanal_ad ON kanallar(kanal);
CREATE INDEX IF NOT EXISTS idx_kanal_system ON kanallar(is_system);
CREATE INDEX IF NOT EXISTS idx_kanal_computer ON kanallar(computer_name, user_name);

-- Türkçe karakter kontrolü için trigger
CREATE TRIGGER IF NOT EXISTS trg_kanallar_unique_insert
BEFORE INSERT ON kanallar
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM kanallar 
            WHERE CASE_TURKISH(kanal) = CASE_TURKISH(NEW.kanal)
        )
        THEN RAISE(ABORT, 'Bu kanal adı zaten mevcut')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_kanallar_unique_update
BEFORE UPDATE OF kanal ON kanallar
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM kanallar 
            WHERE CASE_TURKISH(kanal) = CASE_TURKISH(NEW.kanal)
            AND id != NEW.id
        )
        THEN RAISE(ABORT, 'Bu kanal adı zaten mevcut')
    END;
END;

-- Sistem kayıtlarının değiştirilmesini ve silinmesini engelleyen trigger
CREATE TRIGGER IF NOT EXISTS trg_kanallar_system_update
BEFORE UPDATE ON kanallar
WHEN OLD.is_system = 1
BEGIN
    SELECT CASE 
        WHEN NEW.kanal != OLD.kanal OR NEW.is_system != OLD.is_system
        THEN RAISE(ABORT, 'Sistem tarafından oluşturulan kanallar değiştirilemez')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_kanallar_system_delete
BEFORE DELETE ON kanallar
WHEN OLD.is_system = 1
BEGIN
    SELECT RAISE(ABORT, 'Sistem tarafından oluşturulan kanallar silinemez');
END;

-- Kanallar için Varsayılan Kontrol Trigger'ları
CREATE TRIGGER IF NOT EXISTS trg_kanallar_varsayılan_insert
AFTER INSERT ON kanallar
BEGIN
    UPDATE kanallar 
    SET varsayılan = 0 
    WHERE id != NEW.id AND varsayılan = 1 AND NEW.varsayılan = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_kanallar_varsayılan_update
AFTER UPDATE OF varsayılan ON kanallar
WHEN NEW.varsayılan = 1 AND OLD.varsayılan = 0
BEGIN
    UPDATE kanallar 
    SET varsayılan = 0 
    WHERE id != NEW.id AND varsayılan = 1;
END;

-- Kilit Kontrol
CREATE TRIGGER IF NOT EXISTS trg_kanallar_kilit_kontrol
BEFORE UPDATE ON kanallar
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
CREATE TRIGGER IF NOT EXISTS trg_kanallar_kilit_kontrol_sure
BEFORE UPDATE ON kanallar
FOR EACH ROW
WHEN OLD.is_locked = 1 AND 
     datetime(OLD.locked_at, '+5 minutes') <= datetime('now')
BEGIN
    SELECT CASE 
        WHEN NEW.is_locked = 1
        THEN RAISE(ABORT, 'Kilit süresi dolmuş, yeni kilit için önce kilidi kaldırın')
    END;
END;

-- Silme Kontrolü
CREATE TRIGGER IF NOT EXISTS trg_kanallar_delete_control
BEFORE DELETE ON kanallar
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM mesaj_evrak 
            WHERE kanal_id = OLD.id
        )
        THEN RAISE(ABORT, 'Bu kanal mesaj/evraklarda kullanıldığı için silinemez')
        WHEN EXISTS (
            SELECT 1 FROM dagitim
            WHERE kanal_id = OLD.id
        )
        THEN RAISE(ABORT, 'Bu kanal dağıtımlarda kullanıldığı için silinemez')
    END;
END;`
