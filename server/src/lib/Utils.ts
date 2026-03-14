/**
 * Utility Functions
 */

import nodemailer from "nodemailer";
import CONFIG from "../config";
import Mail from "nodemailer/lib/mailer";

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
  length: number = 8
): Promise<string> => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

/**
 * Mail transporter (created once)
 */
import * as net from "net";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  // ✅ Force IPv4 via socket options
  socketOptions: {
    family: 4,
  },
} as any); // 👈 cast to any to avoid TS overload error

/**
 * Verify SMTP connection on startup
 */

transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

/**
 * Send email
 */
export const mail = async (config: Mail.Options): Promise<void> => {
  try {
    const info = await transporter.sendMail({
      from: `"Chic & Holland" <${process.env.SMTP_USER}>`,
      ...config,
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (error: any) {
    console.error("❌ Failed to send email:", error.message);

    // Map common SMTP errors to readable messages
    if (error.code === "ECONNREFUSED") {
      throw new Error("Mail server connection refused. Check your SMTP host and port.");
    }

    if (error.code === "EAUTH") {
      throw new Error("SMTP authentication failed. Check your email and app password.");
    }

    if (error.code === "ETIMEDOUT") {
      throw new Error("Mail server connection timed out.");
    }

    if (error.responseCode === 550) {
      throw new Error("Recipient email address rejected by the server.");
    }

    // Generic fallback
    throw new Error(`Email sending failed: ${error.message}`);
  }
};