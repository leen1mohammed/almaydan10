"use client";

import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import HomeCard from "./HomeCard";
import { arenaService } from "../../services/arenaService";
import { authService } from "../../services/authService";
import { supabase } from "../../lib/supabase";

/* ===============================
   Animation
================================ */

const float = keyframes`
  0% {
    transform: translateY(0) translateX(0);
  }

  50% {
    transform: translateY(-15px) translateX(5px);
  }

  100% {
    transform: translateY(0) translateX(0);
  }
`;

/* ===============================
   Section
================================ */

const Section = styled.section`
  width: 100%;
  min-height: 800px;

  background: radial-gradient(
    circle at top right,
    rgba(41,255,100,0.18),
    #061125 60%
  );

  display: flex;
  flex-direction: column;
  align-items: center;

  position: relative;

  padding: 120px 20px;

  overflow: hidden;
`;

/* ===============================
   Title
================================ */

const Title = styled.h2`
  color: #ffffff;
  text-align: right;
  text-shadow: 0 3px 0 #ff27f0;
  font-family: "Cairo", sans-serif;
  font-size: 64px;
  font-weight: 1000;
  line-height: 39px;
  margin-bottom: 40px;
  position: relative;
  z-index: 3;
`;

/* ===============================
   Stack
================================ */

const Stack = styled.div`
  position: relative;
  width: 520px;
  height: 560px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
  z-index: 4;

  &:active {
    cursor: grabbing;
  }

  @media (max-width: 900px) {
    width: 100%;
  }
`;

/* ===============================
   Card Wrapper
================================ */

const CardWrap = styled.div`
  position: absolute;
  transition: 0.5s ease;
  will-change: transform, filter, opacity;

  &.center {
    z-index: 5;
    transform: translateX(0) scale(1);
    filter: none;
    opacity: 1;
  }

  &.right1 {
    z-index: 4;
    transform: translateX(120px) scale(0.9);
    filter: blur(2px);
    opacity: 0.8;
  }

  &.left1 {
    z-index: 4;
    transform: translateX(-120px) scale(0.9);
    filter: blur(2px);
    opacity: 0.8;
  }

  &.right2 {
    z-index: 3;
    transform: translateX(220px) scale(0.8);
    filter: blur(4px);
    opacity: 0.6;
  }

  &.left2 {
    z-index: 3;
    transform: translateX(-220px) scale(0.8);
    filter: blur(4px);
    opacity: 0.6;
  }

  @media (max-width: 900px) {
    &.right1,
    &.left1 {
      transform: translateX(80px) scale(0.9);
    }

    &.right2,
    &.left2 {
      transform: translateX(140px) scale(0.8);
    }
  }
`;

/* ===============================
   Floating Layer
================================ */

const Floating = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
`;

/* ===============================
   Floating Item Base
================================ */

const FloatItem = styled.img`
  position: absolute;
  filter: blur(1.5px);
  opacity: 0.8;
  animation: ${float} 6s ease-in-out infinite;
`;

/* ===============================
   Floating Items
================================ */

const Keyboard = styled(FloatItem)`
  width: 90px;
  top: 80px;
  left: 120px;
  animation-delay: 0s;
`;

const GameStick = styled(FloatItem)`
  width: 110px;
  bottom: 60px;
  left: 180px;
  animation-delay: 1s;
`;

const Headphone = styled(FloatItem)`
  width: 100px;
  bottom: 90px;
  right: 140px;
  animation-delay: 2s;
`;

const WarTools = styled(FloatItem)`
  width: 85px;
  top: 140px;
  right: 200px;
  animation-delay: 1.5s;
`;

const Triangle = styled(FloatItem)`
  width: 30px;
  top: 60px;
  right: 350px;
  animation-delay: 0.5s;
`;

const Circle = styled(FloatItem)`
  width: 22px;
  bottom: 140px;
  right: 320px;
  animation-delay: 2.5s;
`;

/* ===============================
   Modal
================================ */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  width: 90%;
  max-width: 430px;
  border-radius: 20px;
  border: 1.4px solid #b37feb;
  background:
    linear-gradient(
      319deg,
      rgba(255,255,255,0.08) 11.46%,
      rgba(255,255,255,0.08) 34.44%,
      rgba(255,255,255,0) 66.52%,
      rgba(255,255,255,0.08) 94.3%
    ),
    #12082A;
  box-shadow:
    0 2px 2px #000,
    0 0 24px rgba(146,84,222,0.35);
  padding: 28px;
  direction: rtl;
  text-align: right;
`;

const ModalTitle = styled.h3`
  color: white;
  font-family: "Cairo", sans-serif;
  font-size: 24px;
  font-weight: 900;
  margin-bottom: 10px;
`;

const ModalText = styled.p`
  color: rgba(255,255,255,0.8);
  font-family: "Cairo", sans-serif;
  font-size: 16px;
  line-height: 1.9;
  margin-bottom: 22px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
`;

const PrimaryBtn = styled.button`
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  background: #29ff64;
  color: #061125;
  font-family: "Cairo", sans-serif;
  font-weight: 900;
  cursor: pointer;
`;

const SecondaryBtn = styled.button`
  border-radius: 12px;
  padding: 10px 18px;
  border: 1.4px solid #b37feb;
  background: transparent;
  color: white;
  font-family: "Cairo", sans-serif;
  font-weight: 700;
  cursor: pointer;
`;

/* ===============================
   Component
================================ */

export default function ArenaSection() {
  const router = useRouter();

  const [arenas, setArenas] = useState([]);
  const [myArenas, setMyArenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const [pendingArena, setPendingArena] = useState(null);
  const [pendingUserName, setPendingUserName] = useState(null);
  const [modalType, setModalType] = useState(null); // "login" | "join" | null

  const startX = useRef(0);

  useEffect(() => {
    async function loadArenas() {
      try {
        setLoading(true);

        const allData = await arenaService.getAllArenas();
        const safeArenas = Array.isArray(allData) ? allData : [];
        setArenas(safeArenas);

        if (safeArenas.length > 0) {
          setActiveIndex((prev) => {
            if (prev >= safeArenas.length) return 0;
            return prev;
          });
        }

        const user = await authService.getCurrentUser();

        if (user?.userName) {
          const myData = await arenaService.getMyArenas(user.userName);
          setMyArenas(Array.isArray(myData) ? myData : []);
        } else {
          setMyArenas([]);
        }
      } catch (error) {
        console.error("مشكلة في جلب الساحات:", error);
      } finally {
        setLoading(false);
      }
    }

    loadArenas();

    const channel = supabase
      .channel("home-arena-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Arena" },
        () => {
          loadArenas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function isJoined(arenaName) {
    return myArenas.some((arena) => arena.name === arenaName);
  }

  function getButtonLabel(arenaName) {
    return isJoined(arenaName) ? "شيك" : "انضم";
  }

  function goToArena(arenaName) {
    router.push(`/arena/${encodeURIComponent(arenaName)}`);
  }

  async function joinArenaAndGo(arenaName, userName) {
    try {
      const { error } = await supabase.from("Joins").insert([
        {
          ArenaName: arenaName,
          PUserName: userName,
          points: 0,
        },
      ]);

      if (error) {
        console.error("Join arena error:", error);
        return;
      }

      setMyArenas((prev) => {
        const targetArena = arenas.find((a) => a.name === arenaName);
        if (!targetArena) return prev;
        if (prev.some((a) => a.name === arenaName)) return prev;
        return [...prev, targetArena];
      });

      goToArena(arenaName);
    } catch (error) {
      console.error("Join arena unexpected error:", error);
    }
  }

  async function handleArenaAction(arena) {
    try {
      const joined = isJoined(arena.name);

      if (joined) {
        goToArena(arena.name);
        return;
      }

      const currentUser = await authService.getCurrentUser();

      if (!currentUser) {
        setPendingArena(arena);
        setPendingUserName(null);
        setModalType("login");
        return;
      }

      let userName = currentUser.userName;

      if (!userName && currentUser.email) {
        const { data: memberData } = await supabase
          .from("Member")
          .select("userName")
          .eq("email", currentUser.email)
          .maybeSingle();

        if (!memberData?.userName) {
          setPendingArena(arena);
          setPendingUserName(null);
          setModalType("login");
          return;
        }

        userName = memberData.userName;
      }

      if (!userName) {
        setPendingArena(arena);
        setPendingUserName(null);
        setModalType("login");
        return;
      }

      setPendingArena(arena);
      setPendingUserName(userName);
      setModalType("join");
    } catch (error) {
      console.error("handleArenaAction error:", error);
    }
  }

  function handleLoginRedirect() {
    if (!pendingArena) return;

    const arenaName = pendingArena.name;
    setModalType(null);
    setPendingArena(null);
    setPendingUserName(null);

    router.push(`/login?redirect=/arena/${encodeURIComponent(arenaName)}`);
  }

  async function handleConfirmJoin() {
    if (!pendingArena || !pendingUserName) return;

    const arenaName = pendingArena.name;
    const userName = pendingUserName;

    setModalType(null);
    await joinArenaAndGo(arenaName, userName);
    setPendingArena(null);
    setPendingUserName(null);
  }

  function closeModal() {
    setModalType(null);
    setPendingArena(null);
    setPendingUserName(null);
  }

  const handleStart = (e) => {
    startX.current = e.touches
      ? e.touches[0].clientX
      : e.clientX;
  };

  const handleEnd = (e) => {
    if (!arenas.length) return;

    const endX = e.changedTouches
      ? e.changedTouches[0].clientX
      : e.clientX;

    const distance = startX.current - endX;

    if (distance > 60) moveNext();
    if (distance < -60) movePrev();
  };

  const moveNext = () => {
    if (!arenas.length) return;

    setActiveIndex((prev) =>
      (prev + 1) % arenas.length
    );
  };

  const movePrev = () => {
    if (!arenas.length) return;

    setActiveIndex((prev) =>
      prev === 0 ? arenas.length - 1 : prev - 1
    );
  };

  const getPositionClass = (i) => {
    const length = arenas.length;
    if (!length) return "";

    let diff = i - activeIndex;

    if (diff > length / 2) diff -= length;
    if (diff < -length / 2) diff += length;

    if (diff === 0) return "center";
    if (diff === 1) return "right1";
    if (diff === -1) return "left1";
    if (diff === 2) return "right2";
    if (diff === -2) return "left2";

    return "";
  };

  return (
    <Section>
      <Title>استكشف الساحات</Title>

      <Floating>
        <Keyboard src="/images/img3D/keyboard.png" />
        <GameStick src="/images/img3D/gameStick.png" />
        <Headphone src="/images/img3D/headphone.png" />
        <WarTools src="/images/img3D/warTools.png" />
        <Triangle src="/images/shapes/triangle.png" />
        <Circle src="/images/shapes/circle.png" />
      </Floating>

      <Stack
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
      >
        {!loading &&
          arenas.map((arena, i) => (
            <CardWrap
              key={arena.name || i}
              className={getPositionClass(i)}
            >
              <HomeCard
                title={arena.name}
                image={arena.pic}
                description={arena.description}
                buttonText={getButtonLabel(arena.name)}
                isJoined={isJoined(arena.name)}
                onAction={() => handleArenaAction(arena)}
              />
            </CardWrap>
          ))}
      </Stack>

      {modalType === "login" && (
        <Overlay onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>سجّل دخولك أولًا</ModalTitle>
            <ModalText>
              ساحة "{pendingArena?.name}" ترحب فيك, لكن تحتاج تسجل دخولك.
            </ModalText>
            <ModalActions>
              <PrimaryBtn onClick={handleLoginRedirect}>
                تسجيل الدخول
              </PrimaryBtn>
              <SecondaryBtn onClick={closeModal}>
                إلغاء
              </SecondaryBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      )}

      {modalType === "join" && (
        <Overlay onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>حيااك</ModalTitle>
            <ModalText>
             جاهز تدخل ساحة "{pendingArena?.name}" 
            </ModalText>
            <ModalActions>
              <PrimaryBtn onClick={handleConfirmJoin}>
                أكيد
              </PrimaryBtn>
              <SecondaryBtn onClick={closeModal}>
                إلغاء
              </SecondaryBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </Section>
  );
}