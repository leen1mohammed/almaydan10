"use client";
 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { supabase } from "@/lib/supabase";
 
/* ===============================
   Helpers
================================ */
 
const STORAGE_KEY = "arena_daily_ids";
 
function getDailyArenaNames(allNames) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (stored.date === today && Array.isArray(stored.names) && stored.names.length === 4) {
      return stored.names;
    }
  } catch {}
 
  const shuffled = [...allNames].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 4);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, names: picked }));
  return picked;
}
 
/* ===============================
   Animations
================================ */
 
const moveLeft = keyframes`
  from { transform: translateX(50%); }
  to   { transform: translateX(0); }
`;
 
const moveRight = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(50%); }
`;
 
const pulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 0.6; }
`;
 
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
 
/* ===============================
   Wrapper
================================ */
 
const Wrapper = styled.section`
  width: 100%;
  padding: 80px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow-x: hidden;
  overflow-y: visible;
  background:
    radial-gradient(circle at bottom center, rgba(41,255,100,0.18), transparent 60%),
    linear-gradient(182deg, #040b19 2.4%, #061125 87.6%);
`;
 
const Title = styled.h2`
  width: 585px;
  color: #fff;
  text-align: right;
  font-family: Cairo;
  font-size: 64px;
  font-weight: 1000;
  line-height: 39px;
  text-shadow: 0 3px 0 #ff27f0;
  margin-bottom: 40px;
  position: relative;
  z-index: 3;

  @media (max-width: 900px) {
    font-size: 40px;
    width: auto;
    text-align: center;
  }
`;
 
/* ===============================
   Rows & Tracks
================================ */
 
const Row = styled.div`
  width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
  margin: 15px 0;
  position: relative;
  z-index: 3;
`;
 
const CARD_GAP = 24;
 
const TrackBase = styled.div`
  display: flex;
  gap: ${CARD_GAP}px;
  width: max-content;
  white-space: nowrap;
  will-change: transform;
`;
 
const TrackLeft = styled(TrackBase)`
  animation: ${moveLeft} 14s linear infinite;
  animation-delay: 0s;
`;
 
const TrackRight = styled(TrackBase)`
  animation: ${moveRight} 14s linear infinite;
  animation-delay: 0s;
`;
 
/* ===============================
   Card
================================ */
 
const Card = styled.div`
  width: 369px;
  height: 121px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 10px;
  border: 1.4px solid #b37feb;
  background:
    linear-gradient(
      319deg,
      rgba(255,255,255,0.8) 11%,
      rgba(255,255,255,0.8) 34%,
      rgba(255,255,255,0)   66%,
      rgba(255,255,255,0.8) 94%
    ),
    #12082a;
  background-blend-mode: soft-light, normal;
  box-shadow: 0 2px 2px #000, 0 0 16px rgba(146,84,222,.32);
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: ${fadeIn} 0.4s ease both;
 
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 24px rgba(146,84,222,.55);
  }
 
  @media (max-width: 900px) {
    width: 300px;
    height: auto;
  }
`;
 
const SkeletonCard = styled(Card)`
  background: #1a0f35;
  animation: ${pulse} 1.5s ease-in-out infinite;
  cursor: default;
  &:hover { transform: none; box-shadow: 0 2px 2px #000, 0 0 16px rgba(146,84,222,.32); }
`;
 
const Avatar = styled.img`
  width: 81px;
  height: 81px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;
 
const TextBox = styled.div`
  display: flex;
  flex-direction: column;
  text-align: right;
  flex: 1;
  overflow: hidden;
`;
 
const CommentText = styled.p`
  width: 167px;
  color: #fff;
  font-family: Cairo;
  font-size: 20px;
  font-weight: 600;
  line-height: 36px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
 
const Username = styled.span`
  color: #fff;
  font-family: Cairo;
  font-size: 14px;
  font-weight: 800;
  line-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
 
/* ===============================
   Modal
================================ */
 
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease;
`;
 
const Modal = styled.div`
  background: #12082a;
  border: 1.4px solid #b37feb;
  border-radius: 16px;
  padding: 32px;
  max-width: 420px;
  width: 90%;
  text-align: right;
  direction: rtl;
  box-shadow: 0 0 40px rgba(146,84,222,.5);
`;
 
const ModalTitle = styled.h3`
  color: #fff;
  font-family: Cairo;
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 12px;
`;
 
const ModalText = styled.p`
  color: #ccc;
  font-family: Cairo;
  font-size: 16px;
  margin-bottom: 24px;
  line-height: 1.7;
`;
 
const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-start;
`;
 
const BtnPrimary = styled.button`
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-family: Cairo;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #6d28d9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
 
const BtnSecondary = styled.button`
  background: transparent;
  color: #b37feb;
  border: 1px solid #b37feb;
  border-radius: 8px;
  padding: 10px 24px;
  font-family: Cairo;
  font-size: 15px;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.7; }
`;
 
/* ===============================
   Lights
================================ */
 
const LightBase = styled.span`
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  z-index: 1;
  pointer-events: none;
`;
const Light1 = styled(LightBase)`width:300px;height:300px;background:rgba(255,39,240,0.22);top:40px;left:120px;`;
const Light2 = styled(LightBase)`width:260px;height:260px;background:rgba(41,255,100,0.25);bottom:40px;right:180px;`;
const Light3 = styled(LightBase)`width:280px;height:280px;background:rgba(255,39,240,0.22);top:140px;right:120px;`;
 
/* ===============================
   Comment Card Component
================================ */
 
function CommentCard({ data, onClick }) {
  return (
    <Card onClick={() => onClick(data)}>
      <Avatar
        src={data.pic || "/images/avatars/default.png"}
        alt={data.PUserName}
        onError={(e) => { e.target.src = "/images/avatars/default.png"; }}
      />
      <TextBox>
        <CommentText>{data.body}</CommentText>
        <Username>@{data.PUserName}</Username>
      </TextBox>
    </Card>
  );
}
 
function SkeletonRow() {
  return <>{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</>;
}
 
/* ===============================
   Main Component
================================ */
 
export default function ArenaComSection() {
  const router = useRouter();
 
  const [comments, setComments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [pending, setPending]         = useState(null);
  const [modalType, setModalType]     = useState(null);
  const [joining, setJoining]         = useState(false);
 
  useEffect(() => {
    async function load() {
      try {
        const { data: arenas, error: arenasErr } = await supabase
          .from("Arena")
          .select("name, pic");
 
        if (arenasErr || !arenas?.length) return;
 
        const allNames    = arenas.map((a) => a.name);
        const dailyNames  = getDailyArenaNames(allNames);
 
        const results = await Promise.all(
          dailyNames.map((arenaName) =>
            supabase
              .from("ArenaItem")
              .select("id, body, PUserName, ArenaName, created_at")
              .eq("ArenaName", arenaName)
              .order("created_at", { ascending: false })
              .limit(4)
              .then(({ data }) => data ?? [])
          )
        );
 
        const arenaMap = Object.fromEntries(arenas.map((a) => [a.name, a.pic]));
        const flat = results.flat().map((item) => ({
          ...item,
          pic: arenaMap[item.ArenaName] ?? null,
        }));
 
        setComments(flat);
      } catch (err) {
        console.error("ArenaComSection fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
 
    load();
  }, []);
 
  async function handleCardClick(comment) {
    const { data: { session } } = await supabase.auth.getSession();
 
    if (!session) {
      setPending(comment);
      setModalType("login");
      return;
    }
 
    const { data: memberData } = await supabase
      .from("Member")
      .select("userName")
      .eq("email", session.user.email)
      .maybeSingle();
 
    if (!memberData?.userName) {
      setPending(comment);
      setModalType("login");
      return;
    }
 
    const { data: joinRow } = await supabase
      .from("Joins")
      .select("id")
      .eq("ArenaName", comment.ArenaName)
      .eq("PUserName", memberData.userName)
      .maybeSingle();
 
    if (!joinRow) {
      setPending({ ...comment, _userName: memberData.userName });
      setModalType("join");
      return;
    }
 
    navigateToComment(comment);
  }
 
  async function handleJoin() {
    if (!pending) return;
    setJoining(true);
 
    try {
      await supabase.from("Joins").insert([
        { ArenaName: pending.ArenaName, PUserName: pending._userName, points: 0 },
      ]);
 
      setModalType(null);
      navigateToComment(pending);
    } catch (err) {
      console.error("Join error:", err);
    } finally {
      setJoining(false);
      setPending(null);
    }
  }
 
  function handleLoginRedirect() {
    const comment = pending;
    setModalType(null);
    setPending(null);
    router.push(
      `/login?redirect=/arena/${encodeURIComponent(comment.ArenaName)}?comment=${comment.id}`
    );
  }
 
  function closeModal() {
    setModalType(null);
    setPending(null);
  }
 
  function navigateToComment(comment) {
    router.push(
      `/arena/${encodeURIComponent(comment.ArenaName)}?comment=${comment.id}#comment-${comment.id}`
    );
  }
 
  function fillTrack(arr, minCount = 10) {
    if (!arr.length) return [];
    const result = [];
    while (result.length < minCount) result.push(...arr);
    return [...result, ...result];
  }
 
  const loopTop = fillTrack(comments);
  const loopBot = fillTrack([...comments].reverse());
 
  return (
    <Wrapper>
      <Title>يحدث داخل الساحة</Title>
 
      <Row>
        <TrackLeft>
          {loading
            ? <SkeletonRow />
            : loopTop.map((item, i) => (
                <CommentCard key={`top-${i}`} data={item} onClick={handleCardClick} />
              ))
          }
        </TrackLeft>
      </Row>
 
      <Row>
        <TrackRight>
          {loading
            ? <SkeletonRow />
            : loopBot.map((item, i) => (
                <CommentCard key={`bot-${i}`} data={item} onClick={handleCardClick} />
              ))
          }
        </TrackRight>
      </Row>
 
      {modalType && (
        <Overlay onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
 
            {modalType === "login" && (
              <>
                <ModalTitle>سجّل دخولك أولاً</ModalTitle>
                <ModalText>
                  تحتاج تسجّل دخول عشان تشوف هذا التعليق داخل ساحة "{pending?.ArenaName}".
                </ModalText>
                <ModalButtons>
                  <BtnPrimary onClick={handleLoginRedirect}>تسجيل الدخول</BtnPrimary>
                  <BtnSecondary onClick={closeModal}>إلغاء</BtnSecondary>
                </ModalButtons>
              </>
            )}
 
            {modalType === "join" && (
              <>
                <ModalTitle>انضم للساحة</ModalTitle>
                <ModalText>
                  هذا التعليق موجود في ساحة "{pending?.ArenaName}"، انضم إليها لتتمكن من رؤية المحادثات الكاملة والوصول للتعليق.
                </ModalText>
                <ModalButtons>
                  <BtnPrimary onClick={handleJoin} disabled={joining}>
                    {joining ? "جاري الانضمام..." : "انضم الآن"}
                  </BtnPrimary>
                  <BtnSecondary onClick={closeModal}>إلغاء</BtnSecondary>
                </ModalButtons>
              </>
            )}
 
          </Modal>
        </Overlay>
      )}
 
      <Light1 /><Light2 /><Light3 />
    </Wrapper>
  );
}