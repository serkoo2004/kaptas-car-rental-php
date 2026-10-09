import nodemailer from "nodemailer";

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM,
  );
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  if (!isSmtpConfigured()) {
    return false;
  }

  await smtpTransporter().sendMail({
    from: process.env.SMTP_FROM,
    subject: "KAPTAŞ şifre sıfırlama",
    html: emailTemplate({
      buttonLabel: "Yeni şifre belirle",
      intro: "KAPTAŞ hesabınız için şifre sıfırlama talebi aldık.",
      notice: "Bu bağlantı 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.",
      url: resetUrl,
    }),
    text: `KAPTAŞ hesabınızın şifresini sıfırlamak için bu bağlantıyı açın: ${resetUrl}\n\nBağlantı 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.`,
    to: email,
  });

  return true;
}

export async function sendAccountVerificationEmail({
  code,
  email,
}: {
  code: string;
  email: string;
}) {
  if (!isSmtpConfigured()) {
    return false;
  }

  await smtpTransporter().sendMail({
    from: process.env.SMTP_FROM,
    subject: "KAPTAŞ e-posta doğrulama kodu",
    html: emailTemplate({
      code,
      intro: "E-posta adresinizi doğrulamak için aşağıdaki kodu kullanın.",
      notice: "Kod 10 dakika geçerlidir. Bu işlemi siz başlatmadıysanız kodu paylaşmayın.",
    }),
    text: `E-posta adresinizi doğrulamak için kodunuz: ${code}. Kod 10 dakika geçerlidir. Bu işlemi siz başlatmadıysanız kodu paylaşmayın.`,
    to: email,
  });

  return true;
}

function smtpTransporter() {
  return nodemailer.createTransport({
    auth: {
      pass: process.env.SMTP_PASSWORD?.replace(/\s/g, ""),
      user: process.env.SMTP_USER,
    },
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    requireTLS: Number(process.env.SMTP_PORT ?? 587) === 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

function emailTemplate({
  buttonLabel,
  code,
  intro,
  notice,
  url,
}: {
  buttonLabel?: string;
  code?: string;
  intro: string;
  notice: string;
  url?: string;
}) {
  const action = code
    ? `<div style="margin:24px 0;padding:16px;border:1px solid #e3bd25;background:#fffaf0;font-size:30px;font-weight:700;letter-spacing:8px;text-align:center">${code}</div>`
    : `<p style="margin:24px 0"><a href="${url}" style="display:inline-block;padding:12px 18px;background:#f6c515;color:#171717;text-decoration:none;font-weight:700">${buttonLabel}</a></p>`;

  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f4f4f2;font-family:Arial,sans-serif;color:#222"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><div style="border-top:4px solid #f6c515;background:#fff;padding:28px"><h1 style="margin:0 0 18px;font-size:22px">KAPTAŞ Car Rental</h1><p style="line-height:1.6">${intro}</p>${action}<p style="color:#666;font-size:13px;line-height:1.6">${notice}</p></div></div></body></html>`;
}
