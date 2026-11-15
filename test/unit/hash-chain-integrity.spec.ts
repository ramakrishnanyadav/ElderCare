import * as crypto from 'crypto';

interface LedgerRow {
  id: string;
  elderId: string;
  doseId: string;
  actorId: string;
  outcome: string;
  evidenceGrade: string;
  timestamp: string;
  previousRowHash: string;
  currentRowHash: string;
}

function computeHash(row: Omit<LedgerRow, 'currentRowHash'>): string {
  const payload = `${row.previousRowHash}|${row.elderId}|${row.doseId}|${row.actorId}|${row.outcome}|${row.evidenceGrade}|${row.timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function verifyChain(chain: LedgerRow[]): boolean {
  let expectedPrevHash = '0'.repeat(64);
  for (const row of chain) {
    if (row.previousRowHash !== expectedPrevHash) return false;
    const computed = computeHash(row);
    if (row.currentRowHash !== computed) return false;
    expectedPrevHash = row.currentRowHash;
  }
  return true;
}

describe('5 & 11. Cryptographic Ledger Hash Chain & Tamper Verifier', () => {
  it('Validates unbroken cryptographic hash chain across sequential rows', () => {
    const elderId = 'elder-kamala';

    // Row 1 (Genesis)
    const row1Base = {
      id: 'row-1',
      elderId,
      doseId: 'dose-slot-1',
      actorId: 'user-kamala',
      outcome: 'TAKEN',
      evidenceGrade: 'PATIENT_REPORTED',
      timestamp: '2026-11-15T08:05:00.000Z',
      previousRowHash: '0'.repeat(64),
    };
    const row1: LedgerRow = { ...row1Base, currentRowHash: computeHash(row1Base) };

    // Row 2
    const row2Base = {
      id: 'row-2',
      elderId,
      doseId: 'dose-slot-2',
      actorId: 'user-sunita',
      outcome: 'TAKEN',
      evidenceGrade: 'CAREGIVER_WITNESSED',
      timestamp: '2026-11-15T09:10:00.000Z',
      previousRowHash: row1.currentRowHash,
    };
    const row2: LedgerRow = { ...row2Base, currentRowHash: computeHash(row2Base) };

    // Row 3 (Correction row)
    const row3Base = {
      id: 'row-3',
      elderId,
      doseId: 'dose-slot-1',
      actorId: 'user-priya',
      outcome: 'SKIPPED',
      evidenceGrade: 'CLINICIAN_RECORDED',
      timestamp: '2026-11-15T11:00:00.000Z',
      previousRowHash: row2.currentRowHash,
    };
    const row3: LedgerRow = { ...row3Base, currentRowHash: computeHash(row3Base) };

    const chain = [row1, row2, row3];
    expect(verifyChain(chain)).toBe(true);
  });

  it('Tamper Detection: Tampering with a single past row outcome breaks chain verification', () => {
    const elderId = 'elder-kamala';
    const row1Base = {
      id: 'row-1',
      elderId,
      doseId: 'dose-slot-1',
      actorId: 'user-kamala',
      outcome: 'TAKEN',
      evidenceGrade: 'PATIENT_REPORTED',
      timestamp: '2026-11-15T08:05:00.000Z',
      previousRowHash: '0'.repeat(64),
    };
    const row1: LedgerRow = { ...row1Base, currentRowHash: computeHash(row1Base) };

    const row2Base = {
      id: 'row-2',
      elderId,
      doseId: 'dose-slot-2',
      actorId: 'user-sunita',
      outcome: 'TAKEN',
      evidenceGrade: 'CAREGIVER_WITNESSED',
      timestamp: '2026-11-15T09:10:00.000Z',
      previousRowHash: row1.currentRowHash,
    };
    const row2: LedgerRow = { ...row2Base, currentRowHash: computeHash(row2Base) };

    // Tampering injection: Malicious actor mutates outcome from 'TAKEN' to 'MISSED' in row 1
    const tamperedRow1 = { ...row1, outcome: 'MISSED' };
    const tamperedChain = [tamperedRow1, row2];

    // Verification MUST FAIL
    expect(verifyChain(tamperedChain)).toBe(false);
  });
});
