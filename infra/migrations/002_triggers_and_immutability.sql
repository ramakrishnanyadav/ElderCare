-- Migration 002: Immutability Triggers on Ledger & Audit Tables
BEGIN;

-- 1. Trigger function to block UPDATE and DELETE on adherence_ledger
CREATE OR REPLACE FUNCTION fn_prevent_ledger_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'CRITICAL SECURITY BREACH: adherence_ledger is append-only. UPDATE and DELETE operations are strictly prohibited.'
    USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_adherence_ledger_immutable
BEFORE UPDATE OR DELETE ON adherence_ledger
FOR EACH ROW EXECUTE FUNCTION fn_prevent_ledger_tampering();

-- 2. Trigger function to block UPDATE and DELETE on access_audit_log
CREATE OR REPLACE FUNCTION fn_prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'CRITICAL SECURITY BREACH: access_audit_log is append-only. UPDATE and DELETE operations are strictly prohibited.'
    USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_access_audit_log_immutable
BEFORE UPDATE OR DELETE ON access_audit_log
FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_tampering();

-- 3. Trigger to purge future unconfirmed dose_events when a medication is discontinued
CREATE OR REPLACE FUNCTION fn_on_medication_discontinued()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_discontinued = TRUE AND (OLD.is_discontinued = FALSE OR OLD.is_discontinued IS NULL) THEN
    -- Delete future SCHEDULED slots that have not yet occurred
    DELETE FROM dose_events
    WHERE medication_version_id IN (
      SELECT id FROM medication_versions WHERE medication_id = NEW.id
    )
    AND scheduled_due_at > NOW()
    AND status = 'SCHEDULED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_medication_discontinued
AFTER UPDATE OF is_discontinued ON medications
FOR EACH ROW EXECUTE FUNCTION fn_on_medication_discontinued();

COMMIT;
