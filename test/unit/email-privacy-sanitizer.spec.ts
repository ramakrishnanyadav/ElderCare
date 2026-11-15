import { NodemailerMailpitProvider } from '../../apps/worker/src/email/EmailProvider';

describe('12. Outbound Email Sanitization & Non-Negotiable #7 Privacy Invariant', () => {
  let provider: NodemailerMailpitProvider;

  beforeEach(() => {
    provider = new NodemailerMailpitProvider();
  });

  it('Hard Invariant: Prohibits clinical medication names in email subjects or text', async () => {
    // Attempting to send an email mentioning "Metformin" or "Insulin" must be intercepted and thrown
    const breachEnvelope = {
      to: 'family@example.com',
      subject: 'Missed Dose: Metformin was not taken',
      text: 'Kamala Devi missed her 500mg Metformin dose.',
      html: '<p>Missed dose.</p>',
    };

    await expect(provider.sendEmail(breachEnvelope)).rejects.toThrow(
      /CRITICAL PRIVACY VIOLATION: Non-Negotiable #7 breach/i
    );
  });

  it('Hard Invariant: Prohibits clinical conditions (diabetes, cancer) in email envelope', async () => {
    const breachEnvelope = {
      to: 'family@example.com',
      subject: 'Eldercare 360: Diabetes Alert',
      text: 'Please check blood sugar.',
      html: '<p>Alert</p>',
    };

    await expect(provider.sendEmail(breachEnvelope)).rejects.toThrow(
      /CRITICAL PRIVACY VIOLATION: Non-Negotiable #7 breach/i
    );
  });

  it('Compliant Envelope: Zero-knowledge subject and body passes sanitizer', async () => {
    // Compliant email has zero clinical names
    const compliantEnvelope = {
      to: 'family@example.com',
      subject: 'Eldercare 360: A routine care event for Kamala requires review',
      text: 'Hello, a scheduled routine is pending review. Open portal: https://app.eldercare360.in/action',
      html: '<p>A routine care event requires review.</p>',
    };

    // If Mailpit isn't reachable during unit tests, the sanitizer check happens BEFORE transport send!
    try {
      await provider.sendEmail(compliantEnvelope);
    } catch (err: any) {
      // If it fails on network connect to localhost:1025, that is expected in unit test without mailpit container
      expect(err.message).not.toContain('CRITICAL PRIVACY VIOLATION');
    }
  });
});
