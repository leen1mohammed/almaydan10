"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const PageWrapper = styled.main`
  min-height: 100vh;
  background: linear-gradient(180deg, #040b19 0%, #061125 100%);
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
  border: 1px solid rgba(179, 127, 235, 0.25);
  background: rgba(14, 21, 35, 0.92);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
`;

const TopBar = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
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
  border: 1px solid rgba(179, 127, 235, 0.4);
  background: rgba(18, 8, 42, 0.95);
  color: white;
  padding: 10px 16px;
  border-radius: 14px;
  font-family: Cairo;
  font-size: 14px;
  cursor: pointer;
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
  padding: 14px 16px;
  border-radius: 22px;
  font-family: Cairo;
  font-size: 16px;
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
  background: ${(props) =>
    props.$isUser
      ? "linear-gradient(135deg, #7b2ff7 0%, #f107a3 100%)"
      : "#171f31"};
  color: white;
  border: ${(props) =>
    props.$isUser ? "none" : "1px solid rgba(255,255,255,0.08)"};
  border-bottom-right-radius: ${(props) => (props.$isUser ? "8px" : "22px")};
  border-bottom-left-radius: ${(props) => (props.$isUser ? "22px" : "8px")};
`;

const ComposerWrap = styled.div`
  border-top: 1px solid rgba(255,255,255,0.08);
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

  &::placeholder {
    color: #8e95a9;
  }
`;

const SendBtn = styled.button`
  height: 56px;
  min-width: 110px;
  padding: 0 18px;
  border-radius: 18px;
  border: 1px solid rgba(179, 127, 235, 0.45);
  background: #12082a;
  color: white;
  font-family: Cairo;
  font-size: 15px;
  font-weight: 700;
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

          <NewChatBtn onClick={handleNewChat}>
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

            <SendBtn onClick={() => sendMessage(input)} disabled={loading}>
              {loading ? "..." : "إرسال"}
            </SendBtn>
          </ComposerInner>

          {error && <ErrorText>{error}</ErrorText>}
        </ComposerWrap>
      </ChatShell>
    </PageWrapper>
  );
}