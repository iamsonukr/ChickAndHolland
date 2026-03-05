import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

// Recommended configuration for proxy connection - for production
const transporter = nodemailer.createTransport({
  host: "139.59.83.183",
  port: 2587,
  secure: false, // false for STARTTLS
  auth: {
    user: "info@chicandholland.com",
    pass: "yktwlbuwklsawauv", // Your app password
  },
  tls: {
    rejectUnauthorized: false, // Ignore SSL certificate mismatch
    ciphers: "SSLv3",
  },
  requireTLS: true,
  debug: true,
  logger: true,
});

////////////////////////////////////////////////////////////////

// For SSL (port 2465), use this configuration instead:
/*
const transporter = nodemailer.createTransporter({
  host: "139.59.83.183",
  port: 2465,
  secure: true, // SSL
  auth: {
    user: "info@chicandholland.com",
    pass: "yktwlbuwklsawauv",
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  debug: true,
  logger: true,
});
*/

//test local
// export const transporter = nodemailer.createTransport({
//   host: "mail.ymtsindia.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "no-relpycrm@ymtsindia.org",
//     pass: "Takeoff@123TK",
//   },
// });

export const sendMail = async (mailOptions: Mail.Options) => {
  return await transporter.sendMail({
    //  - for production
    from: "info@chicandholland.com",
    //for test
    //from: "no-relpycrm@ymtsindia.org",
    ...mailOptions,
  });
};
