import { v7 as uuidv7 } from 'uuid'
import * as os from 'os'

export const createPostaTrigger = () => {
  // O anki sistem bilgilerini al
  const computerName = os.hostname()
  const userName = os.userInfo().username

  return `
    -- Varsa eski trigger'ı sil
    DROP TRIGGER IF EXISTS trg_dagitim_to_posta;
    
    -- Dağıtım tablosundan posta tablosuna otomatik aktarım trigger'ı
    CREATE TRIGGER trg_dagitim_to_posta
    AFTER UPDATE OF kanal_id ON dagitim
    WHEN NEW.kanal_id = (SELECT id FROM kanallar WHERE kanal = 'POSTA')
    BEGIN
        INSERT INTO posta (
            id,
            is_locked,
            locked_by,
            locked_at,
            updated_at,
            created_at,
            computer_name,
            user_name,
            mesaj_evrak_id,
            birlikler_id,
            ust_birlik_id,
            posta_durumu,
            posta_tarihi,
            posta_rr_kodu
        )
        VALUES (
            '${uuidv7()}',                      -- Yeni UUID v7
            0,                                   -- is_locked
            NULL,                                -- locked_by
            NULL,                                -- locked_at
            NULL,                                -- updated_at
            datetime('now', 'localtime'),        -- created_at (Türkiye saati)
            '${computerName}',                   -- O anki bilgisayar adı
            '${userName}',                       -- O anki kullanıcı adı
            NEW.mesaj_evrak_id,                 -- Dağıtımdan gelen
            NEW.birlik_id,                      -- Dağıtımdan gelen
            NEW.ust_birlik_id,                  -- Dağıtımdan gelen
            0,                                   -- posta_durumu default
            NULL,                                -- posta_tarihi
            NULL                                 -- posta_rr_kodu
        );
    END;
    `
}
