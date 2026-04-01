"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";

/* ===============================
   Animations
================================ */

const float1 = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-30px); }
  100% { transform: translateY(0); }
`;

const float2 = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(20px); }
  100% { transform: translateY(0); }
`;

/* ===============================
   Wrapper
================================ */

const Wrapper = styled.section`
  width: 100%;
  min-height: 700px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at bottom center, rgba(41,255,100,0.18), transparent 60%),
    linear-gradient(182deg, #040b19 2.4%, #061125 87.6%);
  padding: 120px 20px;
`;

/* =============================== */

const LightPink = styled.div`
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: rgba(255, 39, 240, 0.22);
  filter: blur(70px);
  bottom: 80px;
  right: 120px;
  animation: ${float1} 8s ease-in-out infinite;
`;

const LightGreen = styled.div`
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(41, 255, 100, 0.25);
  filter: blur(70px);
  bottom: 40px;
  left: 100px;
  animation: ${float2} 10s ease-in-out infinite;
`;

/* =============================== */

const Header = styled.div`
  text-align: right;
  margin-bottom: 40px;
  z-index: 2;
`;

const Text1 = styled.h2`
  color: white;
  font-family: Cairo;
  font-size: 67px;
  font-weight: 900;
  line-height: 100px;
  text-shadow: 0 3px 0 #ff27f0;
`;

const Text2 = styled.h2`
  color: white;
  font-family: Cairo;
  font-size: 66px;
  font-weight: 400;
  line-height: 100px;
`;

const Text3 = styled.p`
  color: white;
  font-family: Cairo;
  font-size: 24px;
  font-weight: 600;
  line-height: 39px;
`;

/* =============================== */

const ChatBox = styled.div`
  width: 604px;
  min-height: 212px;
  background: #0e1523;
  border-radius: 13px;
  border: 5px solid #7d777d;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 2;
`;

/* =============================== */

const Input = styled.textarea`
  width: 100%;
  min-height: 120px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: #9d9d9d;
  font-family: Cairo;
  font-size: 20px;
  line-height: 24px;
`;

/* =============================== */

const AnswerBox = styled.div`
  width: 100%;
  min-height: 120px;
  color: white;
  font-family: Cairo;
  font-size: 20px;
  line-height: 32px;
  white-space: pre-wrap;
`;

/* =============================== */

const ErrorText = styled.div`
  color: #ff6b6b;
  font-family: Cairo;
  font-size: 14px;
  margin-top: 10px;
`;

/* =============================== */

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  width: 100%;
`;

/* =============================== */

const SendBtn = styled.button`
  width: 100px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1.4px solid #b37feb;
  background: #12082a;
  color: white;
  font-family: Cairo;
  font-size: 16px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ToggleBtn = styled.button`
  background: transparent;
  border: none;
  color: #b37feb;
  font-family: Cairo;
  font-size: 14px;
  cursor: pointer;
`;

/* ===============================
   Types
================================ */

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/* ===============================
   Component
================================ */

export default function ChatbotSection() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState<"question" | "answer">("question");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /* ===============================
     Send to API
  ================================= */

  const handleSend = async () => {
  const text = question.trim();
  if (!text || loading) return;

  console.log("[ChatbotSection] sending question:", text);

  setLoading(true);
  setError("");

  const updatedMessages: ChatMessage[] = [
    ...messages,
    { role: "user", content: text },
  ];

  try {
    const res = await fetch("/api/humaidan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedMessages,
      }),
    });

    console.log("[ChatbotSection] response status:", res.status);

    const data = await res.json();
    console.log("[ChatbotSection] response json:", data);

    if (!res.ok) {
      throw new Error(data?.error || "خطأ في الشات بوت");
    }

    const botReply = String(data.answer || "").trim();

    setAnswer(botReply);
    setMessages([
      ...updatedMessages,
      { role: "assistant", content: botReply },
    ]);
    setMode("answer");
    setQuestion("");
  } catch (err) {
    console.error("[ChatbotSection] catch error:", err);
    setError("عذرًا حصل خطأ بسيط، الشات بوت متعطل حاليًا.");
  } finally {
    setLoading(false);
  }
};

  /* ===============================
     Enter Send
  ================================= */

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* =============================== */

  const toggleMode = () => {
    setMode((prev) => (prev === "question" ? "answer" : "question"));
  };

  /* ===============================
     Render
  ================================= */

  return (
    <Wrapper>
      <LightPink />
      <LightGreen />

      <Header>
        <Text1>اسألني</Text1>
        <Text2>ايش ببالك؟</Text2>
        <Text3>عندك سؤال؟ حميدان يجاوبك</Text3>
      </Header>

      <ChatBox>
        {mode === "question" && (
          <Input
            placeholder="اسأل حميدان........"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        )}

        {mode === "answer" && <AnswerBox>{answer}</AnswerBox>}

        {error && <ErrorText>{error}</ErrorText>}

        <Actions>
          <SendBtn onClick={handleSend} disabled={loading}>
            {loading ? "..." : "إرسال"}
          </SendBtn>

          {answer && (
            <ToggleBtn onClick={toggleMode}>
              {mode === "question" ? "عرض الجواب" : "عرض السؤال"}
            </ToggleBtn>
          )}
        </Actions>
      </ChatBox>
    </Wrapper>
  );
}