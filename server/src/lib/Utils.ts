/**
 * @description - generates a random password of length given as parameter
 */

import nodemailer from "nodemailer";
import CONFIG from "../config";
import Mail from "nodemailer/lib/mailer";
export const generatePassword = async (lengthOfPassword = 8) => {
  return Promise.resolve(Math.random().toString(36).slice(-lengthOfPassword));
};

/**
 * @description - generates a random invoice number for the order
 * @param lengthOfInvoiceNumber - length of the invoice number to be generated
 */
export const generateInvoiceNumber = async (lengthOfInvoiceNumber = 8) => {
  return Promise.resolve(
    Math.random().toString(36).slice(lengthOfInvoiceNumber).toUpperCase()
  );
};

export async function mail({ ...config }: Mail.Options) {
  const transporter = nodemailer.createTransport(CONFIG.SMTP_URL, {});
  await transporter.sendMail({
    from: "info@chicandholland.com",
    // to,
    // subject,
    // html,
    // text,
    ...config,
  });
}
