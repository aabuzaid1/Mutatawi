import { Resend } from 'resend';

let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM_EMAIL = 'متطوعي <onboarding@resend.dev>';

// ==================== WELCOME EMAIL ====================
export async function sendWelcomeEmail(
  name: string,
  email: string,
  role: 'volunteer' | 'organization'
) {
  const roleLabel = role === 'volunteer' ? 'متطوع' : 'منظمة';
  const dashboardUrl = role === 'volunteer' ? '/volunteer' : '/organization';

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `مرحباً بك في متطوعي، ${name}! 🎉`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 32px 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">مرحباً بك في متطوعي! 🎉</h1>
    </div>
    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 16px; color: #334155; line-height: 1.8; margin: 0 0 16px;">
        أهلاً <strong>${name}</strong>،
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 0 0 16px;">
        تم تسجيل حسابك بنجاح كـ <strong>${roleLabel}</strong> في منصة متطوعي.
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 0 0 24px;">
        ${role === 'volunteer'
        ? 'يمكنك الآن استكشاف الفرص التطوعية المتاحة والتقدم لها.'
        : 'يمكنك الآن نشر فرص تطوعية وإدارة المتطوعين.'
      }
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://mutatawi.vercel.app${dashboardUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
          الذهاب للوحة التحكم
        </a>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding: 20px 24px; background: #f1f5f9; text-align: center;">
      <p style="font-size: 13px; color: #94a3b8; margin: 0;">
        فريق متطوعي 💜
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ==================== APPLICATION CONFIRMATION (to volunteer) ====================
export async function sendApplicationConfirmation(
  volunteerName: string,
  volunteerEmail: string,
  opportunityTitle: string
) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: volunteerEmail,
    subject: `تم تقديم طلبك بنجاح — ${opportunityTitle} ✅`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">تم تقديم طلبك بنجاح! ✅</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="font-size: 16px; color: #334155; line-height: 1.8; margin: 0 0 16px;">
        أهلاً <strong>${volunteerName}</strong>،
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 0 0 8px;">
        تم تقديم طلبك للفرصة التطوعية:
      </p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="font-size: 16px; color: #166534; font-weight: bold; margin: 0;">
          📋 ${opportunityTitle}
        </p>
      </div>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 16px 0;">
        سيتم مراجعة طلبك من قبل المنظمة وسيتم إبلاغك بالنتيجة. يمكنك متابعة حالة طلبك من لوحة التحكم.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://mutatawi.vercel.app/volunteer" 
           style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
          متابعة طلباتي
        </a>
      </div>
    </div>
    <div style="padding: 20px 24px; background: #f1f5f9; text-align: center;">
      <p style="font-size: 13px; color: #94a3b8; margin: 0;">فريق متطوعي 💜</p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ==================== NEW APPLICATION NOTIFICATION (to organization) ====================
export async function sendNewApplicationNotification(
  orgEmail: string,
  orgName: string,
  volunteerName: string,
  opportunityTitle: string
) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: orgEmail,
    subject: `طلب تطوع جديد — ${volunteerName} تقدم لـ "${opportunityTitle}" 📩`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">طلب تطوع جديد! 📩</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="font-size: 16px; color: #334155; line-height: 1.8; margin: 0 0 16px;">
        أهلاً <strong>${orgName}</strong>،
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 0 0 16px;">
        تقدم متطوع جديد لإحدى فرصكم:
      </p>
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="font-size: 14px; color: #92400e; margin: 0 0 8px;">
          👤 <strong>${volunteerName}</strong>
        </p>
        <p style="font-size: 14px; color: #92400e; margin: 0;">
          📋 <strong>${opportunityTitle}</strong>
        </p>
      </div>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 16px 0;">
        يمكنك مراجعة الطلب وقبوله أو رفضه من لوحة التحكم.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://mutatawi.vercel.app/organization" 
           style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
          مراجعة الطلبات
        </a>
      </div>
    </div>
    <div style="padding: 20px 24px; background: #f1f5f9; text-align: center;">
      <p style="font-size: 13px; color: #94a3b8; margin: 0;">فريق متطوعي 💜</p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ==================== APPLICATION ACCEPTED (to volunteer) ====================
export async function sendApplicationAccepted(
  volunteerName: string,
  volunteerEmail: string,
  opportunityTitle: string
) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: volunteerEmail,
    subject: `🎉 مبروك! تم قبولك في "${opportunityTitle}"`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">مبروك! تم قبولك 🎉</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="font-size: 16px; color: #334155; line-height: 1.8; margin: 0 0 16px;">
        أهلاً <strong>${volunteerName}</strong>،
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 0 0 16px;">
        يسعدنا إبلاغك بأنه تم <strong style="color: #059669;">قبول طلبك</strong> للفرصة التطوعية:
      </p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="font-size: 16px; color: #166534; font-weight: bold; margin: 0;">
          📋 ${opportunityTitle}
        </p>
      </div>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 16px 0;">
        سيتم التواصل معك قريباً بالتفاصيل. شكراً لمساهمتك في العمل التطوعي! 💪
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://mutatawi.vercel.app/volunteer" 
           style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
          عرض طلباتي
        </a>
      </div>
    </div>
    <div style="padding: 20px 24px; background: #f1f5f9; text-align: center;">
      <p style="font-size: 13px; color: #94a3b8; margin: 0;">فريق متطوعي 💜</p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ==================== APPLICATION REJECTED (to volunteer) ====================
export async function sendApplicationRejected(
  volunteerName: string,
  volunteerEmail: string,
  opportunityTitle: string
) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: volunteerEmail,
    subject: `تحديث على طلبك — ${opportunityTitle}`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 40px 20px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #64748b, #475569); padding: 32px 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">تحديث على طلبك</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="font-size: 16px; color: #334155; line-height: 1.8; margin: 0 0 16px;">
        أهلاً <strong>${volunteerName}</strong>،
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 0 0 16px;">
        نشكرك على اهتمامك بالفرصة التطوعية:
      </p>
      <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="font-size: 16px; color: #475569; font-weight: bold; margin: 0;">
          📋 ${opportunityTitle}
        </p>
      </div>
      <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 16px 0;">
        للأسف، لم يتم قبول طلبك في هذه المرة. لا تقلق! هناك فرص تطوعية أخرى كثيرة بانتظارك.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://mutatawi.vercel.app/opportunities" 
           style="display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
          استكشاف فرص أخرى
        </a>
      </div>
    </div>
    <div style="padding: 20px 24px; background: #f1f5f9; text-align: center;">
      <p style="font-size: 13px; color: #94a3b8; margin: 0;">فريق متطوعي 💜</p>
    </div>
  </div>
</body>
</html>`,
  });
}
