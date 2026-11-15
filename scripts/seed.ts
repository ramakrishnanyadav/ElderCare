import { Pool } from 'pg';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

async function seed() {
  console.log('[SEED] Connecting to PostgreSQL to seed demo world: Kamala Devi...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://eldercare_app:app_secure_pass_2026@localhost:5432/eldercare_db',
  });

  const client = await pool.connect();
  const serverPepper = process.env.SERVER_PEPPER || 'eldercare_default_pepper_2026_super_secret';

  try {
    await client.query('BEGIN');

    console.log('[SEED] Cleaning existing demo records...');
    await client.query('TRUNCATE TABLE jobs, adherence_ledger, dose_events, obligations, appointments, inventory, consent_grants, care_members, invites, sessions, devices, medication_versions, medications, elders, users CASCADE');

    console.log('[SEED] Creating users...');
    const defaultPassword = 'Password123!';
    const hashPassword = async (pwd: string) => {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = await argon2.hash(`${pwd}:${salt}:${serverPepper}`, { type: argon2.argon2id });
      return { salt, hash };
    };

    // 1. Kamala Devi (Elder)
    const elderAuth = await hashPassword('KamalaPass123!');
    const elderUser = await client.query(
      `INSERT INTO users (email, phone_e164, full_name, role, argon2id_hash, argon2id_salt, status)
       VALUES ('kamala.devi@eldercare360.local', '+919811023456', 'Kamala Devi', 'ELDER', $1, $2, 'ACTIVE') RETURNING id`,
      [elderAuth.hash, elderAuth.salt]
    );
    const elderUserId = elderUser.rows[0].id;

    const elderProfile = await client.query(
      `INSERT INTO elders (user_id, display_name, primary_timezone, preferred_language)
       VALUES ($1, 'Kamala Devi', 'Asia/Kolkata', 'hi') RETURNING id`,
      [elderUserId]
    );
    const elderId = elderProfile.rows[0].id;

    // Register Kamala's Trusted Device (PIN 1234)
    const pinSalt = crypto.randomBytes(16).toString('hex');
    const pinHash = await argon2.hash(`1234:${pinSalt}:${serverPepper}`, { type: argon2.argon2id });
    await client.query('UPDATE users SET argon2id_hash = $1, argon2id_salt = $2 WHERE id = $3', [pinHash, pinSalt, elderUserId]);

    const device = await client.query(
      `INSERT INTO devices (user_id, device_name, device_fingerprint, public_key_pem)
       VALUES ($1, 'Kamala Samsung Galaxy Tab', 'fingerprint_kamala_tablet_delhi_2026', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----') RETURNING id`,
      [elderUserId]
    );

    // 2. Anita Sharma (Daughter - Family Primary Admin, On-Call)
    const anitaAuth = await hashPassword(defaultPassword);
    const anitaUser = await client.query(
      `INSERT INTO users (email, phone_e164, full_name, role, argon2id_hash, argon2id_salt, status)
       VALUES ('anita.sharma@family.eldercare360.local', '+919845012345', 'Anita Sharma', 'FAMILY_ADMIN', $1, $2, 'ACTIVE') RETURNING id`,
      [anitaAuth.hash, anitaAuth.salt]
    );
    const anitaUserId = anitaUser.rows[0].id;

    // 3. Rahul Sharma (Son - Family Member)
    const rahulAuth = await hashPassword(defaultPassword);
    const rahulUser = await client.query(
      `INSERT INTO users (email, phone_e164, full_name, role, argon2id_hash, argon2id_salt, status)
       VALUES ('rahul.sharma@family.eldercare360.local', '+14165550192', 'Rahul Sharma', 'FAMILY_MEMBER', $1, $2, 'ACTIVE') RETURNING id`,
      [rahulAuth.hash, rahulAuth.salt]
    );
    const rahulUserId = rahulUser.rows[0].id;

    // 4. Dr. Priya Verma (Niece - Family Member / Clinician Advisor)
    const priyaAuth = await hashPassword(defaultPassword);
    const priyaUser = await client.query(
      `INSERT INTO users (email, phone_e164, full_name, role, argon2id_hash, argon2id_salt, status)
       VALUES ('dr.priya.verma@family.eldercare360.local', '+919822098765', 'Dr. Priya Verma', 'FAMILY_MEMBER', $1, $2, 'ACTIVE') RETURNING id`,
      [priyaAuth.hash, priyaAuth.salt]
    );
    const priyaUserId = priyaUser.rows[0].id;

    // 5. Sunita Devi (Caregiver)
    const sunitaAuth = await hashPassword(defaultPassword);
    const sunitaUser = await client.query(
      `INSERT INTO users (email, phone_e164, full_name, role, argon2id_hash, argon2id_salt, status)
       VALUES ('sunita.devi@caregiver.eldercare360.local', '+919871234567', 'Sunita Devi', 'CAREGIVER', $1, $2, 'ACTIVE') RETURNING id`,
      [sunitaAuth.hash, sunitaAuth.salt]
    );
    const sunitaUserId = sunitaUser.rows[0].id;

    console.log('[SEED] Binding Care Circle Members and Scoped Consent Grants...');
    // Care circle membership
    await client.query(
      `INSERT INTO care_members (elder_id, user_id, role, is_on_call) VALUES
       ($1, $2, 'FAMILY_ADMIN', TRUE),
       ($1, $3, 'FAMILY_MEMBER', FALSE),
       ($1, $4, 'FAMILY_MEMBER', FALSE),
       ($1, $5, 'CAREGIVER', FALSE)`,
      [elderId, anitaUserId, rahulUserId, priyaUserId, sunitaUserId]
    );

    // Scoped Consent Grants (All 10 non-negotiable scopes)
    const scopes = [
      'VIEW_MEDICATIONS',
      'RECORD_ADMINISTRATION',
      'EDIT_ROUTINE',
      'PROPOSE_MEDICATION_CHANGE',
      'APPROVE_MEDICATION_CHANGE',
      'MANAGE_APPOINTMENTS',
      'VIEW_DOCUMENTS',
      'VIEW_HEALTH_RECORDS',
      'MANAGE_CARE_TASKS',
      'MANAGE_CIRCLE',
    ];
    for (const sc of scopes) {
      await client.query(
        'INSERT INTO consent_grants (elder_id, grantee_user_id, scope) VALUES ($1, $2, $3)',
        [elderId, anitaUserId, sc]
      );
    }
    // Rahul has View & Manage Appointments
    await client.query('INSERT INTO consent_grants (elder_id, grantee_user_id, scope) VALUES ($1, $2, $3)', [elderId, rahulUserId, 'VIEW_MEDICATIONS']);
    await client.query('INSERT INTO consent_grants (elder_id, grantee_user_id, scope) VALUES ($1, $2, $3)', [elderId, rahulUserId, 'MANAGE_APPOINTMENTS']);
    // Sunita has Record Administration
    await client.query('INSERT INTO consent_grants (elder_id, grantee_user_id, scope) VALUES ($1, $2, $3)', [elderId, sunitaUserId, 'VIEW_MEDICATIONS']);
    await client.query('INSERT INTO consent_grants (elder_id, grantee_user_id, scope) VALUES ($1, $2, $3)', [elderId, sunitaUserId, 'RECORD_ADMINISTRATION']);

    console.log('[SEED] Creating 4 Active Medications and 1 Discontinued Medication...');
    // Med 1: Glycomet-GP 1
    const m1 = await client.query(
      `INSERT INTO medications (elder_id, brand_name, generic_name, is_active)
       VALUES ($1, 'Glycomet-GP 1', 'Glimepiride 1mg + Metformin 500mg', TRUE) RETURNING id`,
      [elderId]
    );
    const m1Id = m1.rows[0].id;
    const v1 = await client.query(
      `INSERT INTO medication_versions (medication_id, version_number, dosage_quantity, dosage_unit, schedule_cron, instructions, proposer_user_id, review_status)
       VALUES ($1, 1, 1.0, 'tablet', 'RRULE:FREQ=DAILY;INTERVAL=1', 'Take immediately before breakfast with warm water', $2, 'VERIFIED') RETURNING id`,
      [m1Id, anitaUserId]
    );
    await client.query('UPDATE medications SET current_version_id = $1 WHERE id = $2', [v1.rows[0].id, m1Id]);
    await client.query('INSERT INTO inventory (medication_id, elder_id, current_stock, daily_consumption_units, refill_threshold_days) VALUES ($1, $2, 18, 1.0, 5)', [m1Id, elderId]);

    // Med 2: Telma 40
    const m2 = await client.query(
      `INSERT INTO medications (elder_id, brand_name, generic_name, is_active)
       VALUES ($1, 'Telma 40', 'Telmisartan 40mg', TRUE) RETURNING id`,
      [elderId]
    );
    const m2Id = m2.rows[0].id;
    const v2 = await client.query(
      `INSERT INTO medication_versions (medication_id, version_number, dosage_quantity, dosage_unit, schedule_cron, instructions, proposer_user_id, review_status)
       VALUES ($1, 1, 1.0, 'tablet', 'RRULE:FREQ=DAILY;INTERVAL=1', 'Take 30 minutes after breakfast for blood pressure', $2, 'VERIFIED') RETURNING id`,
      [m2Id, anitaUserId]
    );
    await client.query('UPDATE medications SET current_version_id = $1 WHERE id = $2', [v2.rows[0].id, m2Id]);
    await client.query('INSERT INTO inventory (medication_id, elder_id, current_stock, daily_consumption_units, refill_threshold_days) VALUES ($1, $2, 22, 1.0, 5)', [m2Id, elderId]);

    // Med 3: Ecospirin 75 (LOW STOCK: 4 doses left!)
    const m3 = await client.query(
      `INSERT INTO medications (elder_id, brand_name, generic_name, is_active)
       VALUES ($1, 'Ecospirin 75', 'Aspirin 75mg (Enteric Coated)', TRUE) RETURNING id`,
      [elderId]
    );
    const m3Id = m3.rows[0].id;
    const v3 = await client.query(
      `INSERT INTO medication_versions (medication_id, version_number, dosage_quantity, dosage_unit, schedule_cron, instructions, proposer_user_id, review_status)
       VALUES ($1, 1, 1.0, 'tablet', 'RRULE:FREQ=DAILY;INTERVAL=1', 'Take after afternoon lunch. Do not take on empty stomach.', $2, 'VERIFIED') RETURNING id`,
      [m3Id, anitaUserId]
    );
    await client.query('UPDATE medications SET current_version_id = $1 WHERE id = $2', [v3.rows[0].id, m3Id]);
    await client.query('INSERT INTO inventory (medication_id, elder_id, current_stock, daily_consumption_units, refill_threshold_days) VALUES ($1, $2, 4, 1.0, 5)', [m3Id, elderId]);

    // Med 4: Rosuvas 10
    const m4 = await client.query(
      `INSERT INTO medications (elder_id, brand_name, generic_name, is_active)
       VALUES ($1, 'Rosuvas 10', 'Rosuvastatin 10mg', TRUE) RETURNING id`,
      [elderId]
    );
    const m4Id = m4.rows[0].id;
    const v4 = await client.query(
      `INSERT INTO medication_versions (medication_id, version_number, dosage_quantity, dosage_unit, schedule_cron, instructions, proposer_user_id, review_status)
       VALUES ($1, 1, 1.0, 'tablet', 'RRULE:FREQ=DAILY;INTERVAL=1', 'Take at bedtime after light dinner', $2, 'VERIFIED') RETURNING id`,
      [m4Id, anitaUserId]
    );
    await client.query('UPDATE medications SET current_version_id = $1 WHERE id = $2', [v4.rows[0].id, m4Id]);
    await client.query('INSERT INTO inventory (medication_id, elder_id, current_stock, daily_consumption_units, refill_threshold_days) VALUES ($1, $2, 30, 1.0, 5)', [m4Id, elderId]);

    // Med 5: Discontinued Medicine (Amlodipine 5mg)
    const m5 = await client.query(
      `INSERT INTO medications (elder_id, brand_name, generic_name, is_active, is_discontinued, discontinued_date)
       VALUES ($1, 'Amlodipine 5mg', 'Amlodipine Besylate 5mg', FALSE, TRUE, '2026-10-24') RETURNING id`,
      [elderId]
    );
    const m5Id = m5.rows[0].id;
    const v5 = await client.query(
      `INSERT INTO medication_versions (medication_id, version_number, dosage_quantity, dosage_unit, schedule_cron, instructions, proposer_user_id, review_status)
       VALUES ($1, 1, 1.0, 'tablet', 'RRULE:FREQ=DAILY;INTERVAL=1', 'Discontinued on 24 Oct 2026 due to bilateral ankle edema.', $2, 'VERIFIED') RETURNING id`,
      [m5Id, anitaUserId]
    );
    await client.query('UPDATE medications SET current_version_id = $1 WHERE id = $2', [v5.rows[0].id, m5Id]);

    console.log('[SEED] Materializing Dose Slots & In-Progress Escalation...');
    const today = new Date();
    today.setHours(8, 0, 0, 0);

    // Morning Slot (08:00 AM) - In progress escalation state
    const slotMorning = await client.query(
      `INSERT INTO dose_events (elder_id, medication_version_id, scheduled_due_at, grace_ends_at, local_wall_time, timezone, status)
       VALUES ($1, $2, $3, $3 + INTERVAL '45 minutes', '08:00', 'Asia/Kolkata', 'UNCONFIRMED') RETURNING id`,
      [elderId, v1.rows[0].id, today]
    );

    // Obligations
    await client.query(
      `INSERT INTO obligations (elder_id, owner_id, category, title, deadline_at, closure_condition, status) VALUES
       ($1, $2, 'MEDICATION_REFILL', 'Refill Ecospirin 75mg (Stock under 5 days)', NOW() + INTERVAL '12 hours', 'Upload pharmacy receipt or mark delivered.', 'PENDING'),
       ($1, $3, 'APPOINTMENT_ESCORT', 'Escort Ma to Max Healthcare Cardiology OPD', NOW() + INTERVAL '24 hours', 'Check in at Max Saket OPD desk.', 'ACKNOWLEDGED')`,
      [elderId, rahulUserId, anitaUserId]
    );

    // 2 Appointments
    await client.query(
      `INSERT INTO appointments (elder_id, doctor_name, specialty, clinic_name, scheduled_at, prep_tasks, brief_summary) VALUES
       ($1, 'Dr. Arvind Kapoor', 'Senior Consultant Cardiologist', 'Max Super Speciality Hospital, Saket', NOW() + INTERVAL '1 day', '[{"id":"p1","title":"Fasting blood sugar log 3 days","completed":true},{"id":"p2","title":"Bring current medicine box","completed":true}]'::jsonb, '{"bloodPressure":"132/84 mmHg"}'::jsonb),
       ($1, 'Dr. Meenakshi Sundaram', 'Retina & Ophthalmology', 'Dr. Shroff Charity Eye Hospital, Daryaganj', NOW() + INTERVAL '5 days', '[{"id":"p3","title":"Bring previous fundus report","completed":false}]'::jsonb, '{"target":"Fundus exam"}'::jsonb)`,
      [elderId]
    );

    await client.query('COMMIT');
    console.log('[SEED] Kamala Devi demo world seeded successfully!');
    console.log('Elder: Kamala Devi (kamala.devi@eldercare360.local / PIN: 1234)');
    console.log('Primary Admin: Anita Sharma (anita.sharma@family.eldercare360.local / Password123!)');
    console.log('Family Member: Rahul Sharma (rahul.sharma@family.eldercare360.local / Password123!)');
    console.log('Caregiver: Sunita Devi (sunita.devi@caregiver.eldercare360.local / Password123!)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED FAILED]', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
