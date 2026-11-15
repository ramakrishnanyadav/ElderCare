-- Migration 001: Core Relational Schema for ELDERCARE 360
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('ELDER', 'FAMILY_ADMIN', 'FAMILY_MEMBER', 'CAREGIVER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'LOCKED_OUT');
CREATE TYPE evidence_grade AS ENUM ('PATIENT_REPORTED', 'CAREGIVER_WITNESSED', 'CLINICIAN_RECORDED', 'DEVICE_RECORDED', 'UNKNOWN');
CREATE TYPE dose_status AS ENUM (
  'SCHEDULED', 'REMINDED', 'ACKNOWLEDGED', 'UNCONFIRMED',
  'REPORTED_TAKEN', 'REPORTED_SKIPPED', 'REPORTED_DECLINED',
  'NEEDS_FOLLOW_UP', 'CORRECTED', 'RESOLVED'
);
CREATE TYPE obligation_status AS ENUM ('PENDING', 'ACKNOWLEDGED', 'FULFILLED', 'BREACHED', 'CANCELLED');
CREATE TYPE review_status AS ENUM ('VERIFIED', 'CLINICIAN_SIGN_OFF_REQUIRED', 'PROVISIONAL_PENDING_APPROVAL');

-- 1. Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_e164 VARCHAR(30) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  argon2id_hash VARCHAR(255),
  argon2id_salt VARCHAR(255),
  failed_attempts INT NOT NULL DEFAULT 0,
  lockout_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Elders
CREATE TABLE elders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  display_name VARCHAR(255) NOT NULL,
  primary_timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  sharing_paused BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Devices (Hardware/Passkey bound)
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(100) NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  public_key_pem TEXT NOT NULL,
  credential_id VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_device UNIQUE (user_id, device_fingerprint)
);

-- 4. Sessions (Hashed Opaque 256-bit Tokens)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  token_hash CHAR(64) UNIQUE NOT NULL, -- SHA-256
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_token ON sessions(token_hash) WHERE revoked_at IS NULL;

-- 5. Invites (Crockford Base32 HMAC Hashed)
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  grantee_email VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  scope VARCHAR(100) NOT NULL,
  hmac_hash CHAR(64) NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  is_redeemed BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Care Circle Members
CREATE TABLE care_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  is_on_call BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_elder_member UNIQUE (elder_id, user_id)
);

-- 7. Scoped Consent Grants (Consent-as-Code)
CREATE TABLE consent_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
  grantee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope VARCHAR(100) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_consent_active ON consent_grants(elder_id, grantee_user_id, is_revoked) WHERE is_revoked = FALSE;

-- 8. Emergency Access (Break-Glass)
CREATE TABLE emergency_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE RESTRICT,
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Medications & Versions
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE RESTRICT,
  brand_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255) NOT NULL,
  current_version_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_discontinued BOOLEAN NOT NULL DEFAULT FALSE,
  discontinued_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE medication_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,
  version_number INT NOT NULL,
  dosage_quantity NUMERIC(6, 2) NOT NULL,
  dosage_unit VARCHAR(50) NOT NULL,
  schedule_cron VARCHAR(100) NOT NULL,
  instructions TEXT,
  verified_document_ref VARCHAR(255),
  proposer_user_id UUID NOT NULL REFERENCES users(id),
  approved_by_user_id UUID REFERENCES users(id),
  review_status review_status NOT NULL DEFAULT 'CLINICIAN_SIGN_OFF_REQUIRED',
  revertible_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_med_version UNIQUE (medication_id, version_number)
);

ALTER TABLE medications ADD CONSTRAINT fk_current_version FOREIGN KEY (current_version_id) REFERENCES medication_versions(id);

-- 10. Materialized Dose Events (14-Day Horizon)
CREATE TABLE dose_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE RESTRICT,
  medication_version_id UUID NOT NULL REFERENCES medication_versions(id) ON DELETE RESTRICT,
  scheduled_due_at TIMESTAMPTZ NOT NULL,
  grace_ends_at TIMESTAMPTZ NOT NULL,
  local_wall_time VARCHAR(10) NOT NULL, -- e.g. "08:00"
  timezone VARCHAR(50) NOT NULL,
  status dose_status NOT NULL DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dose_slot UNIQUE (elder_id, medication_version_id, scheduled_due_at)
);
CREATE INDEX idx_dose_status_due ON dose_events(status, scheduled_due_at);

-- 11. Adherence Ledger (Append-Only Hash Chain)
CREATE TABLE adherence_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dose_event_id UUID REFERENCES dose_events(id) ON DELETE RESTRICT,
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  outcome VARCHAR(50) NOT NULL,
  evidence_grade evidence_grade NOT NULL,
  reason TEXT,
  previous_row_hash CHAR(64) NOT NULL,
  current_row_hash CHAR(64) NOT NULL,
  is_correction BOOLEAN NOT NULL DEFAULT FALSE,
  target_ledger_id UUID REFERENCES adherence_ledger(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ledger_chain ON adherence_ledger(elder_id, recorded_at);

-- 12. Accountable Obligations
CREATE TABLE obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  closure_condition TEXT NOT NULL,
  status obligation_status NOT NULL DEFAULT 'PENDING',
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Escalation Steps
CREATE TABLE escalation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dose_event_id UUID NOT NULL REFERENCES dose_events(id) ON DELETE CASCADE,
  tier INT NOT NULL,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  scheduled_at TIMESTAMPTZ NOT NULL,
  dispatched_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Appointments & Visit Companion
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE RESTRICT,
  doctor_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255) NOT NULL,
  clinic_name VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  prep_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  brief_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Inventory & Refills
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID UNIQUE NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE RESTRICT,
  current_stock NUMERIC(6, 2) NOT NULL,
  daily_consumption_units NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
  refill_threshold_days INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Immutable Access Audit Log
CREATE TABLE access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  resource_type VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  verdict VARCHAR(50) NOT NULL,
  reason TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_row_hash CHAR(64) NOT NULL,
  current_row_hash CHAR(64) NOT NULL
);

-- 17. Transactional Queue Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_jobs_due ON jobs(queue_name, status, run_at) WHERE status = 'PENDING';

COMMIT;
