import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

const FROM_EMAIL = `متطوع <${process.env.SMTP_EMAIL}>`;
const SITE_URL = 'https://mutatawi.vercel.app';
const LOGO_URL = `${SITE_URL}/logo.png`;

/* ==================== Shared Template Wrapper ==================== */

function emailLayout(options: {
  headerColor: string;
  headerTitle: string;
  headerIcon: string;
  bodyHtml: string;
  footerExtra?: string;
}) {
  const { headerColor, headerTitle, headerIcon, bodyHtml, footerExtra } = options;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

          <!-- Logo Bar -->
          <tr>
            <td style="padding:28px 32px 12px;text-align:center;background:#ffffff;">
              <img src="${LOGO_URL}" alt="متطوع" width="60" height="60" style="border-radius:12px;display:inline-block;" />
              <p style="margin:10px 0 0;font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-0.5px;">متطوع</p>
              <p style="margin:2px 0 0;font-size:12px;color:#94a3b8;letter-spacing:1px;">MUTAWWI</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>

          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 32px 20px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background:${headerColor};font-size:28px;text-align:center;">${headerIcon}</div>
              <h1 style="margin:16px 0 0;font-size:22px;font-weight:700;color:#1e293b;">${headerTitle}</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:0 32px 28px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              ${footerExtra || ''}
              <p style="margin:8px 0 4px;font-size:13px;color:#94a3b8;">
                هذا البريد مرسل من منصة <strong style="color:#64748b;">متطوع</strong>
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                <a href="${SITE_URL}" style="color:#6366f1;text-decoration:none;">mutatawi.vercel.app</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} متطوع — جميع الحقوق محفوظة</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string, color: string) {
  return `
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${url}"
         style="display:inline-block;background:${color};color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px;box-shadow:0 4px 12px ${color}40;">
        ${text}
      </a>
    </div>`;
}

function infoCard(text: string, bgColor: string, borderColor: string, textColor: string, icon: string) {
  return `
    <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center;">
      <p style="font-size:16px;color:${textColor};font-weight:700;margin:0;">
        ${icon} ${text}
      </p>
    </div>`;
}

/* ==================== WELCOME EMAIL ==================== */
export async function sendWelcomeEmail(
  name: string,
  email: string,
  role: 'volunteer' | 'organization'
) {
  const roleLabel = role === 'volunteer' ? 'متطوع' : 'منظمة';
  const dashboardUrl = role === 'volunteer' ? '/volunteer' : '/organization';
  const roleEmoji = role === 'volunteer' ? '🤝' : '🏢';

  const bodyHtml = `
    <p style="font-size:16px;color:#334155;line-height:1.9;margin:0 0 12px;">
      مرحباً <strong>${name}</strong>،
    </p>
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 12px;">
      تم تسجيل حسابك بنجاح كـ <strong style="color:#6366f1;">${roleLabel} ${roleEmoji}</strong> في منصة متطوع.
    </p>
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 8px;">
      ${role === 'volunteer'
      ? 'يمكنك الآن استكشاف الفرص التطوعية المتاحة والتقدم لها بسهولة.'
      : 'يمكنك الآن نشر فرص تطوعية جديدة وإدارة المتطوعين من لوحة التحكم.'}
    </p>
    ${ctaButton('ابدأ الآن', SITE_URL + dashboardUrl, '#6366f1')}
  `;

  await getTransporter().sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: `مرحباً بك في متطوع، ${name}! 🎉`,
    html: emailLayout({
      headerColor: '#eef2ff',
      headerTitle: 'مرحباً بك في متطوع!',
      headerIcon: '🎉',
      bodyHtml,
    }),
  });
}

/* ==================== APPLICATION CONFIRMATION (to volunteer) ==================== */
export async function sendApplicationConfirmation(
  volunteerName: string,
  volunteerEmail: string,
  opportunityTitle: string
) {
  const bodyHtml = `
    <p style="font-size:16px;color:#334155;line-height:1.9;margin:0 0 12px;">
      مرحباً <strong>${volunteerName}</strong>،
    </p>
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 8px;">
      تم تقديم طلبك بنجاح للفرصة التطوعية التالية:
    </p>
    ${infoCard(opportunityTitle, '#f0fdf4', '#bbf7d0', '#166534', '📋')}
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 8px;">
      سيتم مراجعة طلبك من قبل المنظمة وسنعلمك بالنتيجة فور صدورها.
    </p>
    ${ctaButton('متابعة طلباتي', SITE_URL + '/volunteer', '#10b981')}
  `;

  await getTransporter().sendMail({
    from: FROM_EMAIL,
    to: volunteerEmail,
    subject: `تم تقديم طلبك بنجاح — ${opportunityTitle} ✅`,
    html: emailLayout({
      headerColor: '#ecfdf5',
      headerTitle: 'تم تقديم طلبك بنجاح!',
      headerIcon: '✅',
      bodyHtml,
    }),
  });
}

/* ==================== NEW APPLICATION NOTIFICATION (to organization) ==================== */
export async function sendNewApplicationNotification(
  orgEmail: string,
  orgName: string,
  volunteerName: string,
  opportunityTitle: string
) {
  const bodyHtml = `
    <p style="font-size:16px;color:#334155;line-height:1.9;margin:0 0 12px;">
      مرحباً <strong>${orgName}</strong>،
    </p>
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 12px;">
      لديك طلب تطوع جديد:
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;margin:20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:14px;color:#92400e;padding:4px 0;"><strong>👤 المتطوع:</strong></td>
          <td style="font-size:14px;color:#92400e;padding:4px 0;text-align:left;font-weight:700;">${volunteerName}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#92400e;padding:4px 0;"><strong>📋 الفرصة:</strong></td>
          <td style="font-size:14px;color:#92400e;padding:4px 0;text-align:left;font-weight:700;">${opportunityTitle}</td>
        </tr>
      </table>
    </div>
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 8px;">
      يمكنك مراجعة الطلب وقبوله أو رفضه من لوحة التحكم.
    </p>
    ${ctaButton('مراجعة الطلبات', SITE_URL + '/organization', '#f59e0b')}
  `;

  await getTransporter().sendMail({
    from: FROM_EMAIL,
    to: orgEmail,
    subject: `طلب تطوع جديد — ${volunteerName} تقدم لـ "${opportunityTitle}" 📩`,
    html: emailLayout({
      headerColor: '#fefce8',
      headerTitle: 'طلب تطوع جديد!',
      headerIcon: '📩',
      bodyHtml,
    }),
  });
}

/* ==================== APPLICATION ACCEPTED (to volunteer) ==================== */
export async function sendApplicationAccepted(
  volunteerName: string,
  volunteerEmail: string,
  opportunityTitle: string
) {
  const bodyHtml = `
    <p style="font-size:16px;color:#334155;line-height:1.9;margin:0 0 12px;">
      مرحباً <strong>${volunteerName}</strong>،
    </p>
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 8px;">
      يسعدنا إبلاغك بأنه تم <strong style="color:#059669;">قبول طلبك</strong> للفرصة التطوعية:
    </p>
    ${infoCard(opportunityTitle, '#f0fdf4', '#bbf7d0', '#166534', '🎊')}
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 8px;">
      سيتم التواصل معك قريباً بالتفاصيل. شكراً لمساهمتك في العمل التطوعي! 💪
    </p>
    ${ctaButton('عرض طلباتي', SITE_URL + '/volunteer', '#10b981')}
  `;

  await getTransporter().sendMail({
    from: FROM_EMAIL,
    to: volunteerEmail,
    subject: `🎉 مبروك! تم قبولك في "${opportunityTitle}"`,
    html: emailLayout({
      headerColor: '#ecfdf5',
      headerTitle: 'مبروك! تم قبولك 🎉',
      headerIcon: '🏆',
      bodyHtml,
    }),
  });
}

/* ==================== APPLICATION REJECTED (to volunteer) ==================== */
export async function sendApplicationRejected(
  volunteerName: string,
  volunteerEmail: string,
  opportunityTitle: string
) {
  const bodyHtml = `
    <p style="font-size:16px;color:#334155;line-height:1.9;margin:0 0 12px;">
      مرحباً <strong>${volunteerName}</strong>،
    </p>
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 8px;">
      نشكرك على اهتمامك بالفرصة التطوعية:
    </p>
    ${infoCard(opportunityTitle, '#f1f5f9', '#e2e8f0', '#475569', '📋')}
    <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 8px;">
      للأسف، لم يتم قبول طلبك في هذه المرة. لا تقلق — هناك فرص تطوعية كثيرة بانتظارك!
    </p>
    ${ctaButton('استكشاف فرص أخرى', SITE_URL + '/opportunities', '#6366f1')}
  `;

  await getTransporter().sendMail({
    from: FROM_EMAIL,
    to: volunteerEmail,
    subject: `تحديث على طلبك — ${opportunityTitle}`,
    html: emailLayout({
      headerColor: '#f8fafc',
      headerTitle: 'تحديث على طلبك',
      headerIcon: '📝',
      bodyHtml,
    }),
  });
}
