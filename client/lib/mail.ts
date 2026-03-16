import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

// Recommended configuration for proxy connection - for production
const transporter = nodemailer.createTransport({
  host: "mail.chicandholland.com", // use hostname, not IP
  port: 587,
  secure: false,       // false = STARTTLS on port 587
  requireTLS: true,    // enforce the TLS upgrade
  auth: {
    user: process.env.SMTP_USER,   // "info@chicandholland.com"
    pass: process.env.SMTP_PASS,   // your app password
  },
  tls: {
    rejectUnauthorized: true,      // keep this true in production
  },
  debug: process.env.NODE_ENV !== "production",
  logger: process.env.NODE_ENV !== "production",
});


export const sendMail = async (mailOptions: Mail.Options) => {
  return await transporter.sendMail({
    //  - for production
    from: "info@chicandholland.com",
    //for test
    //from: "no-relpycrm@ymtsindia.org",
    ...mailOptions,
  });
};
