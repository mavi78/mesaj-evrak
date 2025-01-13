export const postaSchema = `
CREATE TABLE IF NOT EXISTS posta (
    -- Base servis alanları
    id TEXT PRIMARY KEY,
    is_locked INTEGER DEFAULT 0,
    locked_by TEXT,
    locked_at TEXT,
    updated_at TEXT,
    created_at TEXT,
    computer_name TEXT,
    user_name TEXT,
    
    -- Posta'ya özel alanlar
    mesaj_evrak_id TEXT NOT NULL,
    birlikler_id TEXT NOT NULL,
    ust_birlik_id TEXT,
    posta_durumu INTEGER DEFAULT 0,
    posta_tarihi TEXT,
    posta_rr_kodu TEXT,
    
    -- Foreign key kısıtlamaları
    FOREIGN KEY (mesaj_evrak_id) REFERENCES mesaj_evrak(id) ON DELETE CASCADE,
    FOREIGN KEY (birlikler_id) REFERENCES birlikler(id) ON DELETE RESTRICT,
    FOREIGN KEY (ust_birlik_id) REFERENCES birlikler(id) ON DELETE SET NULL
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_posta_mesaj_evrak_id ON posta(mesaj_evrak_id);
CREATE INDEX IF NOT EXISTS idx_posta_birlikler_id ON posta(birlikler_id);
CREATE INDEX IF NOT EXISTS idx_posta_ust_birlik_id ON posta(ust_birlik_id);
CREATE INDEX IF NOT EXISTS idx_posta_durumu ON posta(posta_durumu);
CREATE INDEX IF NOT EXISTS idx_posta_tarihi ON posta(posta_tarihi);

-- Posta silindiğinde dağıtımı güncelleme trigger'ı
CREATE TRIGGER IF NOT EXISTS trg_posta_delete_update_dagitim
AFTER DELETE ON posta
FOR EACH ROW
BEGIN
    UPDATE dagitim 
    SET kanal_id = (SELECT id FROM kanallar WHERE kanal = 'KURYE'),
        teslim_durumu = 0,
        teslim_tarihi = NULL,
        senet_no = NULL
    WHERE mesaj_evrak_id = OLD.mesaj_evrak_id
    AND birlik_id = OLD.birlikler_id
    AND kanal_id = (SELECT id FROM kanallar WHERE kanal = 'POSTA');
END;
`
