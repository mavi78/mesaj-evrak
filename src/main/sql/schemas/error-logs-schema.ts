export const errorLogsSchema = `
  -- Hata logları tablosu
  CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    error_type TEXT NOT NULL,
    error_code TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    message TEXT NOT NULL,
    stack TEXT,
    metadata TEXT CHECK (json_valid(COALESCE(metadata, '{}'))),
    computer_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  -- Hata logları için indeks
  CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
  CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON error_logs(error_code);
  CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
  CREATE INDEX IF NOT EXISTS idx_error_logs_computer ON error_logs(computer_name);
  CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_name);

  -- Son 24 saat içindeki hatalar view'ı
  CREATE VIEW IF NOT EXISTS recent_errors AS
  SELECT *
  FROM error_logs
  WHERE datetime(timestamp) >= datetime('now', '-24 hours')
  ORDER BY timestamp DESC;

  -- Hata istatistikleri view'ı
  CREATE VIEW IF NOT EXISTS error_stats AS
  SELECT 
    error_type,
    error_code,
    severity,
    COUNT(*) as error_count,
    MIN(timestamp) as first_occurrence,
    MAX(timestamp) as last_occurrence,
    computer_name,
    user_name
  FROM error_logs
  GROUP BY error_type, error_code, severity, computer_name, user_name;

  -- Otomatik temizleme trigger'ı (30 günden eski kayıtları siler)
  CREATE TRIGGER IF NOT EXISTS trg_cleanup_old_errors
  AFTER INSERT ON error_logs
  BEGIN
    DELETE FROM error_logs 
    WHERE datetime(timestamp) < datetime('now', '-30 days');
  END;
`
