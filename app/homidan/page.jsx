"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const PageWrapper = styled.main`
  min-height: 100vh;
  padding: 32px 16px;
  color: white;
`;

const ChatShell = styled.div`
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  /* الحدود الخضراء النيون */
  border: 1.4px solid #29FF64; 
  /* الإضاءة البنفسجية (الوهج) */
  box-shadow: 0 6px 37.5px -15px #FF27F0;
  /* خلفية داكنة مع لمسة زجاجية */
  background: linear-gradient(145deg, #0D0A2E, #0a1628);
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    box-shadow: inset 0 0 40px rgba(41, 255, 100, 0.05);
  }
`;

const TopBar = styled.div`
  padding: 20px 24px;
  border: 1px solid rgba(41, 255, 100, 0.3); 
  box-shadow: 0 4px 10px rgba(41, 255, 100, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h1`
  font-family: Cairo;
  font-size: 28px;
  font-weight: 800;
  margin: 0;
`;

const SubTitle = styled.p`
  font-family: Cairo;
  font-size: 14px;
  color: #b9bfd1;
  margin: 0;
`;

const NewChatBtn = styled.button`
  font-size: 14px !important;
  
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MessageRow = styled.div`
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const MessageBubble = styled.div`
  max-width: 76%;
  width: fit-content;
  padding: 14px 18px;
  border-radius: 22px;
  font-family: Cairo;
  font-size: 16px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: white;
  transition: all 0.3s ease;

  /* التحكم في الستايل بناءً على من يرسل الرسالة */
  ${(props) =>
    props.$isUser
      ? `
        /* ستايل اليوزر الزجاجي المشع */
        background: linear-gradient(135deg, rgba(114, 46, 209, 0.9) 0%, rgba(18, 8, 42, 0.95) 100%);
        
        /* حدود مشعة بلون أخضر نيون فسفوري */
        border: 1.5px solid  #B37FEB; 
        
        /* توهج بنفسجي فخم من الخارج */
        box-shadow: 0 0 20px rgba(114, 46, 209, 0.4), inset 0 0 10px rgba(41, 255, 100, 0.1);
        
        border-bottom-right-radius: 8px;
        color: #fff;
        text-shadow: 0 0 5px rgba(255,255,255,0.2);
      `
      : `
        /* ستايل شات حميدان: الزجاجي الغامق (كما هو) */
        background: linear-gradient(319deg, 
          rgba(255, 255, 255, 0.15) 0%, 
          rgba(255, 255, 255, 0.05) 50%, 
          transparent 100%
        ), #12082A;
        
        background-blend-mode: soft-light, normal;
        border: 1.4px solid #B37FEB;
        box-shadow: 0 0 15px rgba(146, 84, 222, 0.2);
        border-bottom-left-radius: 8px;
      `}
`;

const ComposerWrap = styled.div`
  border: 1px solid rgba(41, 255, 100, 0.3); 
  box-shadow: 0 4px 10px rgba(41, 255, 100, 0.05);
  padding: 18px 20px;
`;

const ComposerInner = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

const ComposerInput = styled.textarea`
  flex: 1;
  min-height: 56px;
  max-height: 180px;
  resize: none;
  overflow-y: auto;
  border-radius: 18px;
  border: 1px solid rgba(179, 127, 235, 0.35);
  background: #101726;
  color: white;
  font-family: Cairo;
  font-size: 16px;
  line-height: 1.8;
  padding: 14px 16px;
  outline: none;

  &::-webkit-scrollbar {
    width: 6px;
  }
 

  &::placeholder {
    color: #8e95a9;
  }

  &:focus {
  border-color: #FF27F0;
  box-shadow: 0 0 10px rgba(41, 255, 100, 0.1);
}
`;

const SendBtn = styled.button`
  height: 56px;
  min-width: 110px;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

const ErrorText = styled.div`
  color: #ff7b7b;
  font-family: Cairo;
  font-size: 14px;
  margin-top: 10px;
`;

const LoadingBubble = styled(MessageBubble)`
  color: #c7cde0;
`;

function clearHumaidanStorage() {
  sessionStorage.removeItem("humaidan_initial_question");
  sessionStorage.removeItem("humaidan_chat_messages");
}

export default function HomidanPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const composerRef = useRef(null);
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    const savedMessages = sessionStorage.getItem("humaidan_chat_messages");
    const initialQuestion = sessionStorage.getItem("humaidan_initial_question");

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          hasBootstrappedRef.current = true;
          return;
        }
      } catch {}
    }

    if (initialQuestion && !hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      sendMessage(initialQuestion, true);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("humaidan_chat_messages", JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      clearHumaidanStorage();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      setTimeout(() => {
        if (window.location.pathname !== "/homidan") {
          clearHumaidanStorage();
        }
      }, 0);
    };
  }, []);

  async function sendMessage(rawText, isInitial = false) {
    const text = String(rawText || "").trim();
    if (!text || loading) return;

    setLoading(true);
    setError("");

    const nextMessages = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(nextMessages);

    if (!isInitial) {
      setInput("");
    }

    try {
      const res = await fetch("/api/humaidan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "حدث خطأ في حميدان.");
      }

      const botReply = String(data?.answer || "").trim() || "عذرًا، لم أستطع تجهيز رد مناسب الآن.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: botReply },
      ]);
    } catch (err) {
      setError("عذرًا حصل خطأ بسيط، الشات بوت متعطل حاليًا.");
    } finally {
      setLoading(false);
      sessionStorage.removeItem("humaidan_initial_question");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleNewChat() {
    clearHumaidanStorage();
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <PageWrapper>
      <ChatShell>
        <TopBar>
          <TitleWrap>
            <Title>حميدان</Title>
            <SubTitle>شبيك لبيك حميدان بين يديك   </SubTitle>
          </TitleWrap>

          <NewChatBtn onClick={handleNewChat} className="btn-base btn-green !w-[130px] !h-[40px] !min-w-0 !px-0">
            محادثة جديدة
          </NewChatBtn>

        </TopBar>

        <MessagesArea>
          {messages.map((msg, index) => (
            <MessageRow key={`${msg.role}-${index}`} $isUser={msg.role === "user"}>
              <MessageBubble $isUser={msg.role === "user"}>
                {msg.content}
              </MessageBubble>
            </MessageRow>
          ))}

          {loading && (
            <MessageRow $isUser={false}>
              <LoadingBubble $isUser={false}>
                جاري التفكير...
              </LoadingBubble>
            </MessageRow>
          )}

          <div ref={messagesEndRef} />
        </MessagesArea>

        <ComposerWrap>
          <ComposerInner>
            <ComposerInput
              ref={composerRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك لحميدان..."
              rows={1}
            />

            <SendBtn 
            onClick={() => sendMessage(input)} 
            disabled={loading} 
            className="btn-base btn-green !w-[130px] !h-[40px] !min-w-0 !px-0 !mb-[9px]"
          >
            {loading ? "..." : "إرسال"}
          </SendBtn>
          </ComposerInner>

          {error && <ErrorText>{error}</ErrorText>}
        </ComposerWrap>
      </ChatShell>
    </PageWrapper>
  );
}