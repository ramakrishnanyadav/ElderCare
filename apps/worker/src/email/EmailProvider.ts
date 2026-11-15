import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';

export interface EmailEnvelope {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
}

export interface EmailProvider {
  sendEmail(envelope: EmailEnvelope): Promise<{ messageId: string }>;
}

export class NodemailerMailpitProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NodemailerMailpitProvider.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10), // Mailpit
      secure: false,
      ignoreTLS: true,
    });
  }

  async sendEmail(envelope: EmailEnvelope): Promise<{ messageId: string }> {
    // Non-Negotiable #7: Hard Invariant Check - Zero Health Details in Email Subjects or Bodies!
    const prohibitedClinicalPatterns = [
      /\bmetformin\b/i,
      /\binsulin\b/i,
      /\btelma\b/i,
      /\becospirin\b/i,
      /\bamlodipine\b/i,
      /\bmg\b/i,
      /\bdiabetes\b/i,
      /\bhypertension\b/i,
      /\bcancer\b/i,
      /\bdose\b/i,
      /\bpill\b/i,
    ];

    for (const pattern of prohibitedClinicalPatterns) {
      if (pattern.test(envelope.subject) || pattern.test(envelope.text)) {
        throw new Error(
          `CRITICAL PRIVACY VIOLATION: Non-Negotiable #7 breach. Prohibited clinical keyword (${pattern}) detected in outgoing email envelope.`
        );
      }
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"ELDERCARE 360" <notifications@eldercare360.in>',
        to: envelope.to,
        subject: envelope.subject,
        text: envelope.text,
        html: envelope.html,
      });

      this.logger.log(`Email dispatched to Mailpit [ID: ${info.messageId}]. Subject: ${envelope.subject}`);
      return { messageId: info.messageId };
    } catch (err: any) {
      this.logger.error(`Failed to dispatch email via Mailpit transport: ${err.message}`);
      throw err;
    }
  }
}
