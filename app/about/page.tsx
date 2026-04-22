"use client";
import Image from "next/image";
import React, { useState } from "react";


type MoveStyle = React.CSSProperties;

export default function AboutPage() {
  const [ctrlStyle, setCtrlStyle] = useState<MoveStyle>({});
  const [shieldStyle, setShieldStyle] = useState<MoveStyle>({});
  const [headsetStyle, setHeadsetStyle] = useState<MoveStyle>({});

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const getMoveStyle = (
    e: React.MouseEvent<HTMLDivElement>,
    strength = 20,
    rotate = 8
  ): MoveStyle => {
    const rect = e.currentTarget.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    return {
      transform: `translate(${x * strength}px, ${y * strength}px) rotate(${x * rotate}deg)`,
      transition: "transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
    };
  };

  const resetMoveStyle: MoveStyle = {
    transform: "translate(0px, 0px) rotate(0deg)",
    transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      setStatus("يرجى تعبئة العنوان والرسالة");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("");

      const response = await fetch("/api/send-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "تعذر إرسال الرسالة");
      }

      setTitle("");
      setMessage("");
      setStatus("تم إرسال الرسالة بنجاح");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "حدث خطأ أثناء الإرسال"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061125] text-white">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-180px] top-[40px] h-[520px] w-[520px] rounded-full bg-[#B24BFF]/20 blur-[140px]" />
        <div className="absolute left-[-160px] top-[220px] h-[420px] w-[420px] rounded-full bg-[#00FFA3]/10 blur-[130px]" />
        <div className="absolute left-[20%] top-[42%] h-[520px] w-[520px] rounded-full bg-[#B24BFF]/20 blur-[150px]" />
        <div className="absolute right-[8%] top-[56%] h-[420px] w-[420px] rounded-full bg-[#00FFA3]/10 blur-[130px]" />
        <div className="absolute bottom-[-220px] left-1/2 h-[620px] w-[1200px] -translate-x-1/2 rounded-full bg-[#FF27F0]/35 blur-[170px]" />
        <div className="absolute bottom-[120px] left-[18%] h-[300px] w-[300px] rounded-full bg-[#A855F7]/18 blur-[110px]" />
        <div className="absolute bottom-[140px] right-[12%] h-[320px] w-[320px] rounded-full bg-[#A855F7]/16 blur-[120px]" />
      </div>

      <div className="relative z-10">
        

        <div className="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-16">
          {/* Section 1 */}
          <section className="relative min-h-[560px] pt-12 md:min-h-[620px] md:pt-20">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div className="order-2 flex justify-center md:order-1 md:justify-start">
                <div
                  onMouseMove={(e) => setCtrlStyle(getMoveStyle(e, 18, 6))}
                  onMouseLeave={() => setCtrlStyle(resetMoveStyle)}
                  style={ctrlStyle}
                  className="relative h-[clamp(220px,28vw,460px)] w-[clamp(220px,28vw,460px)] will-change-transform"
                >
                  <Image
                    src="/about/controller.png"
                    alt="Controller"
                    fill
                    priority
                    className="object-contain drop-shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
                  />
                </div>
              </div>

              <div className="order-1 mb-4 text-right md:order-2 md:mb-0 md:pr-4 xl:pr-2">
                <h1
                  className="font-extrabold leading-[1.02] text-[clamp(1.7rem,4.5vw,4.2rem)]"
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  ماهو مشروع
                  <br />
                  <span className="text-white [text-shadow:3px_3px_0px_#FF27F0]">
                    الميدان؟
                  </span>
                </h1>

                <p
                  className="mt-5 ml-auto max-w-[650px] text-[clamp(0.85rem,1.1vw,1.05rem)] leading-[2] text-white/85"
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  الميدان منصة متكاملة صُممت لتكون الساحة الرقمية الأولى لعشّاق
                  الرياضات الإلكترونية في المملكة العربية السعودية. انطلقت فكرة
                  الميدان استجابةً للحاجة إلى منصة موحّدة تجمع بين متابعة
                  البطولات، والتواصل المجتمعي، والبث المباشر في وقت تشتّتت فيه
                  مصادر المعلومات وافتقرت فيه التجربة العربية إلى محتوى شامل
                  ومنظّم.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="relative min-h-[520px] pt-4 md:min-h-[600px] md:pt-10">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div className="text-left md:pl-2 md:text-right xl:pl-8">
                <h2
                  className="font-extrabold leading-[1.02] text-[clamp(1.6rem,4.2vw,4rem)]"
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  ايش يقدم
                  <br />
                  <span className="text-white [text-shadow:3px_3px_0px_#FF27F0]">
                    الميدان؟
                  </span>
                </h2>

                <p
                  className="mt-5 max-w-[680px] text-[clamp(0.85rem,1.1vw,1.05rem)] leading-[2] text-white/85"
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  يجمع الميدان بين أحدث جداول البطولات، وبث المباريات المباشر،
                  ونتائج المباريات التفصيلية، ومساحات تفاعلية للدردشة والتواصل
                  خلال البث. كما يوفر مساحات خاصة للفرق والمجموعات، إلى جانب
                  ميزة توقّع نتائج المباريات للمساهمة في تعزيز التفاعل المجتمعي.
                </p>
              </div>

              <div className="mt-6 flex justify-center md:mt-0 md:justify-end">
                <div
                  onMouseMove={(e) => setShieldStyle(getMoveStyle(e, 14, 4))}
                  onMouseLeave={() => setShieldStyle(resetMoveStyle)}
                  style={shieldStyle}
                  className="relative h-[clamp(180px,22vw,360px)] w-[clamp(180px,22vw,360px)] will-change-transform"
                >
                  <Image
                    src="/about/shield.png"
                    alt="Shield"
                    fill
                    className="object-contain drop-shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="relative min-h-[520px] pt-6 md:min-h-[600px] md:pt-14">
            <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
              <div className="flex justify-center md:justify-start">
                <form
                  onSubmit={handleSubmit}
                  className="w-full max-w-[500px] xl:ml-8"
                >
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان الفضفضة..."
                    className="h-[54px] w-full rounded-[14px] border border-[#3A2157] bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(215,142,255,0.22)_100%)] px-5 text-right text-[clamp(0.85rem,1vw,1rem)] text-[#2E193F] shadow-[0_10px_25px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] outline-none placeholder:text-[#4A2A63]/80"
                    style={{ fontFamily: "var(--font-cairo)" }}
                  />

                  <div className="h-4" />

                  <div className="relative min-h-[145px] rounded-[16px] border border-[#3A2157] bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(215,142,255,0.22)_100%)] px-5 py-5 shadow-[0_10px_25px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="فضفض لنا..."
                      className="h-[105px] w-full resize-none bg-transparent text-right text-[clamp(0.85rem,1vw,1rem)] text-[#2E193F] outline-none placeholder:text-[#4A2A63]/80"
                      style={{ fontFamily: "var(--font-cairo)" }}
                    />

                    <button
                      type="submit"
                      aria-label="send"
                      disabled={isSubmitting}
                      className="absolute bottom-4 left-4 transition hover:scale-105 disabled:opacity-60"
                    >
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M21 3L3 10.53L10.84 12.84L13.16 20.68L21 3Z"
                          stroke="#1F1030"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-3 text-right text-sm text-white/80">
                    {status}
                  </div>
                </form>
              </div>

              <div className="mt-8 flex items-end justify-center gap-5 md:mt-0 md:justify-end xl:gap-8 xl:pr-6">
                <div
                  onMouseMove={(e) => setHeadsetStyle(getMoveStyle(e, 20, 8))}
                  onMouseLeave={() => setHeadsetStyle(resetMoveStyle)}
                  style={headsetStyle}
                  className="relative h-[clamp(110px,13vw,210px)] w-[clamp(110px,13vw,210px)] will-change-transform"
                >
                  <Image
                    src="/about/headset.png"
                    alt="Headset"
                    fill
                    className="object-contain drop-shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
                  />
                </div>

                <h3
                  className="text-right font-extrabold leading-[1.04] text-[clamp(4.5rem,0vw,0rem)]"
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  سمعنا
                  <br />
                  <span className="text-white [text-shadow:5px_5px_0px_#FF27F0]">
                    صوتك
                  </span>
                </h3>
              </div>
            </div>

            <div className="h-20 md:h-28" />
          </section>
        </div>
      </div>
    </main>
  );
}