import OpenAI from "openai";
import { HUMAIDAN_SYSTEM_PROMPT } from "@/lib/humaidanSystemPrompt";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type UiMessage = {
  role: "user" | "assistant";
  content: string;
};

function isUiMessage(item: unknown): item is UiMessage {
  if (typeof item !== "object" || item === null) return false;

  const obj = item as Record<string, unknown>;

  return (
    (obj.role === "user" || obj.role === "assistant") &&
    typeof obj.content === "string"
  );
}

function sanitizeMessages(input: unknown): UiMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(isUiMessage)
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-20);
}

const DIRECT_ANSWER_POLICY = `
تعليمات تنفيذية إضافية:
- جاوب مباشرة أولًا كلما أمكن.
- لا تطلب من المستخدم التوضيح إلا إذا كان السؤال غير مفهوم فعلًا أو ناقصًا بشكل يمنع أي جواب مفيد.
- إذا كان السؤال عامًا، فأعطِ جوابًا عامًا ومباشرًا بدل طلب التوضيح.
- إذا كان هناك أكثر من احتمال معقول للسؤال، اختر الاحتمال الأكثر شيوعًا وأجب عليه أولًا بإيجاز.
- بعد الجواب يمكنك إضافة سطر قصير فقط يفتح باب التوضيح، مثل:
  "إذا كنت تقصد جانبًا معينًا أقدر أوضح أكثر."
- لا تبدأ الرد بسؤال توضيحي إلا عند الضرورة القصوى.
- لا تُكثر من الاعتذارات أو طلبات الشرح من المستخدم.
- اجعل أول رد مختصرًا ومباشرًا.
`;

export async function POST(req: Request) {
  try {
    console.log("[HUMAIDAN_API] POST called");

    const body = await req.json().catch(() => ({}));
    console.log("[HUMAIDAN_API] request body:", body);

    const messages = sanitizeMessages(body?.messages);
    console.log("[HUMAIDAN_API] sanitized messages:", messages);

    if (!messages.length) {
      return Response.json(
        { error: "لا توجد رسالة صالحة." },
        { status: 400 }
      );
    }

    const model = process.env.OPENAI_MODEL;
    const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

    console.log("[HUMAIDAN_API] model exists:", model);
    console.log("[HUMAIDAN_API] api key exists:", hasApiKey);

    if (!model) {
      return Response.json(
        { error: "متغير OPENAI_MODEL غير موجود في البيئة." },
        { status: 500 }
      );
    }

    if (!hasApiKey) {
      return Response.json(
        { error: "متغير OPENAI_API_KEY غير موجود في البيئة." },
        { status: 500 }
      );
    }

    const input = [
      {
        role: "system" as const,
        content: HUMAIDAN_SYSTEM_PROMPT,
      },
      {
        role: "system" as const,
        content: DIRECT_ANSWER_POLICY,
      },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    console.log("[HUMAIDAN_API] calling OpenAI...");

    const response = await client.responses.create({
      model,
      input,
    });

    console.log("[HUMAIDAN_API] OpenAI response received");
    console.log("[HUMAIDAN_API] output_text:", response.output_text);

    return Response.json({
      answer:
        response.output_text ||
        "عذرًا، لم أستطع تجهيز رد مناسب الآن.",
    });
  } catch (error: unknown) {
    console.error("[HUMAIDAN_API_ERROR]", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: number }).status === 429
    ) {
      return Response.json(
        {
          error:
            "خدمة حميدان غير متاحة حاليًا بسبب مشكلة في رصيد أو فوترة الـ API.",
        },
        { status: 429 }
      );
    }

    return Response.json(
      { error: "حدث خطأ أثناء الاتصال بحميدان." },
      { status: 500 }
    );
  }
}