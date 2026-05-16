"use client";

/**
 * الملف: app/camp/empty/page.tsx
 * الدور: صفحة حالة (Empty State) تُعرض عندما لا يمتلك المستخدم أي معسكر بعد.
 *
 * يرتبط بـ:
 * - app/camp/page.tsx (بوابة المعسكر): يحول المستخدم لهذه الصفحة إذا ما عنده campId
 * - app/camp/create/page.tsx: زر "أنشئ معسكرك" يوجه لصفحة الإنشاء
 *
 * المدخلات: لا يوجد
 * المخرجات:
 * - توجيه المستخدم إلى /camp/create عند الضغط على زر الإنشاء
 */

import { useRouter } from "next/navigation";

export default function CampEmptyPage() {
  /**
   * الجزء: Router
   * الدور: توجيه المستخدم لصفحة إنشاء المعسكر عند الضغط على زر "أنشئ معسكرك"
   * المدخلات: لا يوجد
   * المخرجات: router.push("/camp/create")
   */
  const router = useRouter();

  return (
    <div className="min-h-screen text-white flex flex-col">
      {/* 
        الجزء: محتوى الصفحة الأساسي
        الدور: عرض رسالة واضحة للمستخدم بأن لا يوجد معسكر + CTA لإنشاء معسكر
        يرتبط بـ: التصميم/الهوية البصرية للموقع
      */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          {/* 
            الجزء: رسالة الحالة
            الدور: توضيح سبب الصفحة للمستخدم
          */}
          <p className="text-3xl md:text-4xl text-white/30 mb-8">
            لا يوجد لديك معسكر حتى الآن..
          </p>

          {/* 
            الجزء: زر إنشاء المعسكر
            الدور: خطوة واضحة للمستخدم لإنشاء معسكر جديد
            المدخلات: click
            المخرجات: انتقال إلى صفحة الإنشاء
          */}
          <button
            type="button"
            onClick={() => router.push("/camp/create")}
            className="px-10 py-3 rounded-full bg-purple-700 hover:bg-purple-600 transition shadow-lg"
          >
            أنشئ معسكرك
          </button>
        </div>
      </div>

      {/* 
        الجزء: فاصل سفلي (اختياري)
        الدور: يخلي الصفحة متناسقة لو عندك Footer ثابت
      */}
      <div className="h-8" />
    </div>
  );
}