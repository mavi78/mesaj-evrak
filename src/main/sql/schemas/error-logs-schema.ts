export const errorLogsSchema = `
  -- Hata logları tablosu
  CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT,
    computer_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    error_type TEXT NOT NULL,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    metadata TEXT CHECK (json_valid(COALESCE(metadata, '{}')))
  );

  -- Hata logları için indeks
  CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
  CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON error_logs(error_code);
  CREATE INDEX IF NOT EXISTS idx_error_logs_computer ON error_logs(computer_name);
  CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_name);

  -- Son 24 saat içindeki hatalar view'ı
  CREATE VIEW IF NOT EXISTS vw_recent_errors AS
  SELECT *
  FROM error_logs
  WHERE datetime(created_at) >= datetime('now', '-24 hours')
  ORDER BY created_at DESC;

  -- Hata istatistikleri view'ı
  CREATE VIEW IF NOT EXISTS vw_error_stats AS
  SELECT 
    error_type,
    error_code,
    COUNT(*) as error_count,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence,
    computer_name,
    user_name
  FROM error_logs
  GROUP BY error_type, error_code, computer_name, user_name;

  -- Otomatik temizleme trigger'ı (30 günden eski kayıtları siler)
  CREATE TRIGGER IF NOT EXISTS trg_cleanup_old_errors
  AFTER INSERT ON error_logs
  BEGIN
    DELETE FROM error_logs 
    WHERE datetime(created_at) < datetime('now', '-30 days');
  END;
`
