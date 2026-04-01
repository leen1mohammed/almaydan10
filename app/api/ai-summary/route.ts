import { NextResponse } from "next/server";

function buildFallbackSummary(data: {
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  game: string;
  tournament: string;
  status: string;
  startAt: string;
}) {
  const {
    teamA,
    teamB,
    scoreA = 0,
    scoreB = 0,
    game,
    tournament,
    status,
    startAt,
  } = data;

  const dateText = new Date(startAt).toLocaleString("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (status === "FINISHED") {
    let analysisText = "المواجهة جاءت متقاربة في مجملها.";
    if (scoreA > scoreB) {
      analysisText = `دخل ${teamA} المباراة بصورة أفضل ونجح في حسمها لصالحه.`;
    } else if (scoreB > scoreA) {
      analysisText = `ظهر ${teamB} بصورة أكثر فاعلية وتمكن من حسم المواجهة لصالحه.`;
    }

    return [
      `أقيمت مباراة ${teamA} ضد ${teamB} ضمن بطولة ${tournament} في لعبة ${game}.`,
      `انتهت المواجهة بنتيجة ${scoreA} - ${scoreB}.`,
      analysisText,
      `المؤشرات العامة توضح أن الفريق الفائز كان الأكثر قدرة على إدارة المباراة لصالحه.`,
      `وقت المباراة المسجل في النظام: ${dateText}.`,
    ].join("\n");
  }

  if (status === "LIVE") {
    return [
      `تجري الآن مباراة ${teamA} ضد ${teamB} ضمن بطولة ${tournament} في لعبة ${game}.`,
      `النتيجة الحالية هي ${scoreA} - ${scoreB}.`,
      `المباراة ما تزال مفتوحة على جميع الاحتمالات، والقراءة النهائية تبقى مرتبطة بتطور مجريات اللقاء.`,
      `البيانات الحالية تعكس صورة أولية فقط وليست تقييمًا نهائيًا.`,
      `وقت المباراة المسجل في النظام: ${dateText}.`,
    ].join("\n");
  }

  return [
    `المواجهة القادمة ستجمع بين ${teamA} و${teamB} ضمن بطولة ${tournament} في لعبة ${game}.`,
    `المباراة لم تبدأ بعد وفق البيانات الحالية.`,
    `هذه المواجهة تبدو منتظرة من ناحية التنافس، لكن الحكم الفني يبقى لما بعد انطلاق اللقاء.`,
    `وقت المباراة المسجل في النظام: ${dateText}.`,
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      teamA,
      teamB,
      scoreA,
      scoreB,
      game,
      tournament,
      status,
      startAt,
    } = body ?? {};

    if (!teamA || !teamB || !game || !tournament || !status || !startAt) {
      return NextResponse.json(
        { error: "بيانات المباراة ناقصة." },
        { status: 400 }
      );
    }

    const fallbackSummary = buildFallbackSummary({
      teamA,
      teamB,
      scoreA,
      scoreB,
      game,
      tournament,
      status,
      startAt,
    });

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        summary: fallbackSummary,
        source: "fallback",
        note: "OPENAI_API_KEY غير موجود داخل بيئة المشروع.",
      });
    }

    const statusLabel =
      status === "FINISHED"
        ? "منتهية"
        : status === "LIVE"
        ? "مباشرة"
        : "قادمة";

    const prompt = `
أنت محلل رياضي محترف ومتخصص في الرياضات الإلكترونية، وتكتب بأسلوب عربي قوي واحترافي يشبه تغطيات المنصات الرياضية.

المطلوب:
اكتب تحليلًا عربيًا احترافيًا للمباراة التالية، وكأنك محلل يعلّق على نتيجتها أو وضعها الحالي.

بيانات المباراة:
- الفريق الأول: ${teamA}
- الفريق الثاني: ${teamB}
- النتيجة: ${scoreA ?? 0} - ${scoreB ?? 0}
- اللعبة: ${game}
- البطولة: ${tournament}
- حالة المباراة: ${statusLabel}
- وقت المباراة: ${startAt}

تعليمات مهمة جدًا:
- اكتب بأسلوب تحليلي رياضي احترافي، وليس مجرد وصف مباشر.
- إذا كانت المباراة منتهية، فسر النتيجة بصورة تحليلية عامة: من كان الأفضل؟ ماذا تعكس النتيجة؟ ما دلالة الفارق؟
- إذا كانت المباراة مباشرة، فاكتب أنها جارية مع قراءة تحليلية أولية للوضع الحالي.
- إذا كانت المباراة قادمة، فاكتب تقديمًا موجزًا للمواجهة وتوقعًا عامًا بدون جزم.
- لا تخترع أي تفاصيل غير موجودة في البيانات.
- لا تذكر خرائط، جولات، أسماء لاعبين، أو لحظات حاسمة غير مذكورة.
- لا تستخدم لغة آلية أو باردة.
- اجعل النص بين 5 و7 أسطر.
- اجعل النص مناسبًا للعرض داخل موقع esports عربي احترافي.
- اختم بجملة تحليلية قصيرة تعطي انطباعًا مهنيًا.

اكتب النص مباشرة بدون عناوين أو تعداد.
`.trim();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("FULL OPENAI ERROR:", JSON.stringify(data, null, 2));

      return NextResponse.json({
        summary: fallbackSummary,
        source: "fallback",
        note: data?.error?.message || "فشل طلب OpenAI داخل المشروع.",
      });
    }

    const summary =
      data?.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      fallbackSummary;

    return NextResponse.json({
      summary,
      source: "openai",
      note: "تم إنشاء التلخيص عبر OpenAI.",
    });
  } catch (error) {
    console.error("ai-summary route error:", error);

    return NextResponse.json({
      summary: "تعذر إنشاء الملخص حاليًا.",
      source: "fallback",
      note: error instanceof Error ? error.message : "خطأ غير متوقع داخل route.ts",
    });
  }
}