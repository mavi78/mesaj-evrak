export const errorLogSchema = `
-- Hata kayıtları tablosu
CREATE TABLE IF NOT EXISTS error_logs (
    -- Base Service Alanları
    id TEXT PRIMARY KEY,                    -- Benzersiz hata ID'si (UUID)
    is_locked BOOLEAN NOT NULL DEFAULT 0,   -- Kilit durumu
    locked_by TEXT,                         -- Kilitleyen kullanıcı
    locked_at TEXT,                         -- Kilit zamanı
    updated_at TEXT,                        -- Son güncelleme zamanı
    created_at TEXT NOT NULL DEFAULT (datetime('now')), -- Oluşturma zamanı
    computer_name TEXT NOT NULL,            -- İşlem yapılan bilgisayar adı
    user_name TEXT NOT NULL,                -- İşlem yapan kullanıcı adı

    -- Hata Alanları
    error_type TEXT NOT NULL,               -- Hata tipi (örn: ValidationError, DatabaseError)
    error_code TEXT NOT NULL,               -- Hata kodu (örn: ERR_001, DB_CONNECTION_FAILED)
    severity TEXT NOT NULL,                 -- Hata önemi (LOW, MEDIUM, HIGH, CRITICAL)
    message TEXT NOT NULL,                  -- Hata mesajı
    stack TEXT,                             -- Stack trace (opsiyonel)
    metadata TEXT,                          -- JSON formatında ek bilgiler (opsiyonel)
    
    -- Kısıtlamalar
    CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CHECK (json_valid(COALESCE(metadata, '{}'))),
    CHECK (
        (locked_by IS NOT NULL AND locked_at IS NOT NULL) OR
        (locked_by IS NULL AND locked_at IS NULL)
    )
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_error_type_severity ON error_logs(error_type, severity);
CREATE INDEX IF NOT EXISTS idx_error_created ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_computer ON error_logs(computer_name, user_name);
CREATE INDEX IF NOT EXISTS idx_error_locked ON error_logs(is_locked);

-- İstatistiksel görünüm
CREATE VIEW IF NOT EXISTS error_stats AS
SELECT 
    error_type,
    severity,
    COUNT(*) as error_count,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence,
    computer_name,
    user_name
FROM error_logs
GROUP BY error_type, severity, computer_name, user_name;

-- Son 24 saat görünümü
CREATE VIEW IF NOT EXISTS recent_errors AS
SELECT *
FROM error_logs
WHERE datetime(created_at) >= datetime('now', '-24 hours')
ORDER BY created_at DESC;

-- Kilit Kontrol Trigger'ı
CREATE TRIGGER IF NOT EXISTS trg_error_logs_kilit_kontrol
BEFORE UPDATE ON error_logs
FOR EACH ROW
WHEN NEW.is_locked = 0 AND OLD.is_locked = 1
BEGIN
    SELECT CASE 
        WHEN OLD.locked_by != NEW.locked_by AND
             datetime(OLD.locked_at, '+5 minutes') > datetime('now')
        THEN RAISE(ABORT, 'Kayıt başka bir kullanıcı tarafından kilitlenmiş ve kilit süresi dolmamış')
    END;
END;

-- Otomatik Kilit Açma Trigger'ı
CREATE TRIGGER IF NOT EXISTS trg_error_logs_kilit_kontrol_sure
BEFORE UPDATE ON error_logs
FOR EACH ROW
WHEN OLD.is_locked = 1 AND 
     datetime(OLD.locked_at, '+5 minutes') <= datetime('now')
BEGIN
    SELECT CASE 
        WHEN NEW.is_locked = 1
        THEN RAISE(ABORT, 'Kilit süresi dolmuş, yeni kilit için önce kilidi kaldırın')
    END;
END;

-- Otomatik temizleme trigger'ı
CREATE TRIGGER IF NOT EXISTS cleanup_old_errors
AFTER INSERT ON error_logs
BEGIN
    DELETE FROM error_logs 
    WHERE datetime(created_at) < datetime('now', '-30 days')
    AND is_locked = 0; -- Kilitli kayıtları silme
END;`
