/**
 * Utility Functions
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate random password
 */
export const generatePassword = async (length: number = 8): Promise<string> => {
  return Math.random().toString(36).slice(-length);
};

/**
 * Generate random invoice number
 */
export const generateInvoiceNumber = async (
  length: number = 8,
): Promise<string> => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

/**
 * Mail options interface
 */
export interface MailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
  }[];
}

/**
 * Send email via Resend
 */
export const mail = async (config: MailOptions): Promise<any> => {
  try {
    const emailPayload = {
      from: `Chic & Holland <${process.env.RESEND_FROM_EMAIL}>`,
      to: Array.isArray(config.to) ? config.to : [config.to],
      subject: config.subject,
      ...(config.html && { html: config.html }),
      ...(config.text && { text: config.text }),
      ...(config.cc && {
        cc: Array.isArray(config.cc) ? config.cc : [config.cc],
      }),
      ...(config.bcc && {
        bcc: Array.isArray(config.bcc) ? config.bcc : [config.bcc],
      }),
      ...(config.replyTo && { replyTo: config.replyTo }),
      ...(config.attachments && {
        attachments: config.attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
      }),
    } as Parameters<typeof resend.emails.send>[0];

    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      throw Object.assign(new Error(error.message), { resendError: error });
    }

    console.log("[Mail] Email sent", {
      id: data?.id,
      to: emailPayload.to,
      subject: emailPayload.subject,
    });

    return data;
  } catch (error: any) {
    console.error("[Mail] Failed to send email", {
      message: error?.message ?? String(error),
      to: Array.isArray(config.to) ? config.to : [config.to],
      subject: config.subject,
      resendError: error?.resendError,
      stack: error?.stack,
    });

    if (error.resendError) {
      const { name } = error.resendError;

      if (name === "validation_error") {
        throw new Error("Invalid email address or missing required fields.");
      }
      if (name === "missing_api_key" || name === "invalid_api_key") {
        throw new Error("Resend API key is missing or invalid.");
      }
      if (name === "rate_limit_exceeded") {
        throw new Error("Email rate limit exceeded. Please try again later.");
      }
    }

    throw new Error(`Email sending failed: ${error.message}`);
  }
};
