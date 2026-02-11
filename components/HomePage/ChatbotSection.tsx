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
    radial-gradient(
      circle at bottom center,
      rgba(41,255,100,0.18),
      transparent 60%
    ),
    linear-gradient(
      182deg,
      #040b19 2.4%,
      #061125 87.6%
    );

  padding: 120px 20px;
`;

/* ===============================
   Lights
================================ */

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

/* ===============================
   Header
================================ */

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

/* ===============================
   Chat Box
================================ */

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

/* ===============================
   Input
================================ */

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

/* ===============================
   Answer
================================ */

const AnswerBox = styled.div`
  width: 100%;
  min-height: 120px;

  color: white;

  font-family: Cairo;

  font-size: 20px;
  line-height: 32px;
`;

/* ===============================
   Error
================================ */

const ErrorText = styled.div`
  color: #ff6b6b;

  font-family: Cairo;

  font-size: 14px;

  margin-top: 10px;
`;

/* ===============================
   Actions
================================ */

const Actions = styled.div`
  display: flex;

  justify-content: space-between;
  align-items: center;

  margin-top: 15px;

  width: 100%;
`;

/* ===============================
   Buttons
================================ */

const SendBtn = styled.button`
  width: 100px;

  padding: 8px 16px;

  border-radius: 10px;

  border: 1.4px solid #b37feb;

  background:
    linear-gradient(
      319deg,
      rgba(255,255,255,0.8) 11.46%,
      rgba(255,255,255,0.8) 34.44%,
      rgba(255,255,255,0) 66.52%,
      rgba(255,255,255,0.8) 94.3%
    ),
    #12082a;

  background-blend-mode: soft-light, normal;

  box-shadow:
    0 2px 2px #000,
    0 0 16px rgba(146, 84, 222, 0.32);

  color: white;

  font-family: Cairo;

  font-size: 16px;
  font-weight: 600;

  cursor: pointer;

  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-4px) scale(1.03);

    box-shadow:
      0 6px 8px #000,
      0 0 24px rgba(146, 84, 222, 0.6);
  }

  &:active {
    transform: translateY(-1px) scale(0.97);

    box-shadow:
      0 2px 4px #000,
      0 0 10px rgba(146, 84, 222, 0.4);
  }
`;

const ToggleBtn = styled.button`
  background: transparent;

  border: none;

  color: #b37feb;

  font-family: Cairo;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

/* ===============================
   Component
================================ */

export default function ChatbotSection() {

  /* States */

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState("question");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* Send */

  const handleSend = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");

    try {
      await new Promise((r) => setTimeout(r, 800));

      const fakeResponse =
        "هذا رد تجريبي من الشات بوت، وسيتم ربطه لاحقًا مع API حقيقي.";

      setAnswer(fakeResponse);

      setMode("answer");

    } catch (err) {
      setError("عذرًا حصل خطأ بسيط، الشات بوت متعطل حاليًا.");

    } finally {
      setLoading(false);
    }
  };

  /* Toggle */

  const toggleMode = () => {
    setMode((prev) =>
      prev === "question" ? "answer" : "question"
    );
  };

  /* Render */

  return (
    <Wrapper>

      {/* Lights */}
      <LightPink />
      <LightGreen />

      {/* Header */}
      <Header>

        <Text1>اسألني</Text1>

        <Text2>ايش ببالك؟</Text2>

        <Text3>
          عندك سؤال؟ حميدان يجاوبك
        </Text3>

      </Header>

      {/* Chat Box */}
      <ChatBox>

        {/* Question Mode */}
        {mode === "question" && (
          <Input
            placeholder="اسأل حميدان........"
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            disabled={loading}
          />
        )}

        {/* Answer Mode */}
        {mode === "answer" && (
          <AnswerBox>
            {answer}
          </AnswerBox>
        )}

        {/* Error */}
        {error && (
          <ErrorText>
            {error}
          </ErrorText>
        )}

        {/* Actions */}
        <Actions>

          <SendBtn
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "..." : "إرسال"}
          </SendBtn>

          {answer && (
            <ToggleBtn
              onClick={toggleMode}
            >
              {mode === "question"
                ? "عرض الجواب"
                : "عرض السؤال"}
            </ToggleBtn>
          )}

        </Actions>

      </ChatBox>

    </Wrapper>
  );
}
