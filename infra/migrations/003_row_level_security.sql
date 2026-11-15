-- Migration 003: PostgreSQL Row-Level Security (Secondary Defense Layer)
BEGIN;

-- Grant permissions to non-superuser app role
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO eldercare_app;
-- Notice: adherence_ledger and access_audit_log triggers prevent UPDATE/DELETE even if granted
REVOKE UPDATE, DELETE ON adherence_ledger FROM eldercare_app;
REVOKE UPDATE, DELETE ON access_audit_log FROM eldercare_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO eldercare_app;

-- Enable RLS on all patient-scoped tables
ALTER TABLE elders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE adherence_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current app user is member of elder's circle or the elder themselves
CREATE OR REPLACE FUNCTION fn_has_elder_access(target_elder_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Read app.current_user_id set via SET LOCAL app.current_user_id
  current_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Check if user is the elder
  IF EXISTS (SELECT 1 FROM elders WHERE id = target_elder_id AND user_id = current_user_id) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if user is an active care member with unrevoked consent
  IF EXISTS (
    SELECT 1 FROM care_members cm
    JOIN consent_grants cg ON cg.elder_id = cm.elder_id AND cg.grantee_user_id = cm.user_id
    WHERE cm.elder_id = target_elder_id
      AND cm.user_id = current_user_id
      AND cm.status = 'ACTIVE'
      AND cg.is_revoked = FALSE
      AND (cg.valid_until IS NULL OR cg.valid_until > NOW())
  ) THEN
    RETURN TRUE;
  END IF;

  -- 3. Check for active emergency access
  IF EXISTS (
    SELECT 1 FROM emergency_access
    WHERE elder_id = target_elder_id
      AND requester_user_id = current_user_id
      AND is_active = TRUE
      AND expires_at > NOW()
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies on tables
CREATE POLICY rls_elders_policy ON elders
  FOR ALL TO eldercare_app
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID OR fn_has_elder_access(id));

CREATE POLICY rls_medications_policy ON medications
  FOR ALL TO eldercare_app
  USING (fn_has_elder_access(elder_id));

CREATE POLICY rls_dose_events_policy ON dose_events
  FOR ALL TO eldercare_app
  USING (fn_has_elder_access(elder_id));

CREATE POLICY rls_adherence_ledger_policy ON adherence_ledger
  FOR ALL TO eldercare_app
  USING (fn_has_elder_access(elder_id));

CREATE POLICY rls_obligations_policy ON obligations
  FOR ALL TO eldercare_app
  USING (fn_has_elder_access(elder_id));

CREATE POLICY rls_appointments_policy ON appointments
  FOR ALL TO eldercare_app
  USING (fn_has_elder_access(elder_id));

COMMIT;
