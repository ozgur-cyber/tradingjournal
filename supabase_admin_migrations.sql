-- ========================================================
-- TRADINGJOURNAL BETA - ADMIN BACKOFFICE MIGRATION SCRIPT
-- ========================================================
-- Bu scripti Supabase Dashboard > SQL Editor üzerinden çalıştırın.

-- 1. ROLE TİPLERİ VE USERS TABLOSU GÜNCELLEMESİ
-- Eğer `user_role` adında bir tip yoksa oluşturulur.
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('User', 'SeasonAdmin', 'Moderator', 'SuperAdmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ERİŞİM LOGLARI (LOGIN LOGS)
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    device_info TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE
);

-- 3. İHLAL VE ŞİKAYETLER (USER FLAGS)
CREATE TABLE IF NOT EXISTS user_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Null = Sistem verdi
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, RESOLVED, DISMISSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. UYGULAMA İÇİ MESAJLAR & UYARILAR
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_system_alert BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LEADERBOARD MODERASYONU
CREATE TABLE IF NOT EXISTS leaderboard_exclusions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades tablosuna leaderboard dışında tutma flag'i ekle
DO $$ BEGIN
    ALTER TABLE trades ADD COLUMN exclude_from_leaderboard BOOLEAN DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 6. SEZON YÖNETİMİ
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS season_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    severity VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. DENETİM LOGLARI (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, 
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    details JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PLATFORM SETTINGS VE LEADERBOARD KURALLARI
CREATE TABLE IF NOT EXISTS platform_settings (
    id INT PRIMARY KEY DEFAULT 1,
    admin_passcode VARCHAR(50) DEFAULT 'X4RS25',
    max_pnl NUMERIC DEFAULT 10000,
    pnl_weight NUMERIC DEFAULT 0.40,
    win_rate_weight NUMERIC DEFAULT 0.25,
    rr_weight NUMERIC DEFAULT 0.20,
    consistency_weight NUMERIC DEFAULT 0.15,
    min_trades INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İlk satırı ekle (yoksa)
INSERT INTO platform_settings (id, admin_passcode) 
VALUES (1, 'X4RS25') 
ON CONFLICT (id) DO NOTHING;

-- Eğer tablo zaten varsa ve sütunlar eksikse ekle
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS max_pnl NUMERIC DEFAULT 10000;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS pnl_weight NUMERIC DEFAULT 0.40;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS win_rate_weight NUMERIC DEFAULT 0.25;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS rr_weight NUMERIC DEFAULT 0.20;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS consistency_weight NUMERIC DEFAULT 0.15;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS min_trades INTEGER DEFAULT 0;

-- 9. USER PRIVACY SETTINGS COLUMNS
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_pnl BOOLEAN DEFAULT true;

-- 10. TAKİP SİSTEMİ (FOLLOWS TABLE)
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 11. USER SETTINGS EXTENSIONS (ACCOUNT SIZE & COUNTRY)
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_size INTEGER DEFAULT 100000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'TR';

-- SON


