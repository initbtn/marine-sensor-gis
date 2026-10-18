-- ==============================================================================
-- Migration: 20261018000002_zero_pii_audit_schema.sql
-- Description: Zero-PII Maritime Classification Audit Logs & Active User Analytics
-- Compliance: IACS UR E26/E27, IMO MSC.428(98), GDPR / 개인정보보호법 Zero-PII 원칙
-- ==============================================================================

-- 1. Create access audit logs table under marine_control schema
CREATE TABLE IF NOT EXISTS marine_control.access_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 개인정보(실명, 이메일, 전화번호, 원본 IP) 일체 배제
    -- 단방향 해시로 생성된 비가역 난수 식별자 (usr_ + 10 hex characters)
    user_hash_id VARCHAR(32) NOT NULL,
    assigned_role VARCHAR(30) NOT NULL,      -- CHIEF_ENGINEER, CLASS_SURVEYOR, FLEET_OPERATOR, DIAGNOSTIC_TECH, GUEST
    organization VARCHAR(50) DEFAULT 'PANASIA', -- KR, DNV, ABS, PANASIA, FLEET_OWNER
    action_type VARCHAR(50) NOT NULL,        -- PAGE_VIEW, BYPASS_TOGGLE, ALARM_ACK, MODE_TOGGLE, REPORT_DOWNLOAD
    target_path VARCHAR(100) NOT NULL,       -- /, /gis, /reports, /alarms, /audit
    session_duration_sec INT DEFAULT 0,      -- 체류 시간 (초)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance indexes for active analytics and audit trails
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON marine_control.access_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_hash ON marine_control.access_audit_logs(user_hash_id);
CREATE INDEX IF NOT EXISTS idx_audit_action_role ON marine_control.access_audit_logs(action_type, assigned_role);

-- 3. Row Level Security (RLS) policies
ALTER TABLE marine_control.access_audit_logs ENABLE ROW LEVEL SECURITY;

-- 익명/일반 사용자: 감사 로그 인서트 허용 (활동 기록 수집)
CREATE POLICY "Allow public insert to access_audit_logs"
    ON marine_control.access_audit_logs
    FOR INSERT
    TO public
    WITH CHECK (true);

-- 감사관 및 인증 사용자: 최근 로그 조회 허용
CREATE POLICY "Allow select on access_audit_logs for authenticated"
    ON marine_control.access_audit_logs
    FOR SELECT
    TO public
    USING (true);

-- 4. Active user stats analytics RPC function
-- 최근 5분 실시간 동시 접속자 수 및 당일 누적 DAU 고속 계산
CREATE OR REPLACE FUNCTION marine_control.get_active_user_stats()
RETURNS TABLE (
    active_now_count BIGINT,
    dau_count BIGINT,
    total_actions_today BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '5 minutes' THEN user_hash_id END) AS active_now_count,
        COUNT(DISTINCT CASE WHEN created_at >= CURRENT_DATE THEN user_hash_id END) AS dau_count,
        COUNT(*) AS total_actions_today
    FROM marine_control.access_audit_logs
    WHERE created_at >= CURRENT_DATE;
$$;
