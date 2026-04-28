import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = body?.title?.trim();
    const message = body?.message?.trim();

    if (!title || !message) {
      return NextResponse.json(
        { error: "العنوان والرسالة مطلوبان." },
        { status: 400 }
      );
    }

    const emailUser = process.env.FEEDBACK_EMAIL_USER;
    const emailPass = process.env.FEEDBACK_EMAIL_PASS;
    const emailTo = process.env.FEEDBACK_EMAIL_TO || "almaidanapp@gmail.com";

    if (!emailUser || !emailPass) {
      return NextResponse.json(
        { error: "إعدادات البريد غير مكتملة في .env.local" },
        { status: 500 }
      );
    }

const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"Almaidan Feedback" <${emailUser}>`,
      to: emailTo,
      subject: `فضفضة جديدة | ${title}`,
      text: `العنوان: ${title}\n\nالرسالة:\n${message}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.9;">
          <h2>وصلت فضفضة جديدة من صفحة حول</h2>
          <p><strong>العنوان:</strong> ${escapeHtml(title)}</p>
          <p><strong>الرسالة:</strong></p>
          <div style="white-space: pre-wrap;">${escapeHtml(message)}</div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("send-feedback error:", error);
    return NextResponse.json(
      { error: "تعذر إرسال الرسالة حاليًا." },
      { status: 500 }
    );
  }
}