"use client";

import { useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import HomeCard from "./HomeCard";

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
   Component
================================ */

export default function ArenaSection() {

  /* ===============================
     Data
  ================================ */

  const arenas = [
    {
      image: "/images/cardsImg/warzone.jpg",
      title: "مجتمع Call of Duty",
      members: "479",
    },
    {
      image: "/images/cardsImg/lol.jpg",
      title: "League of Legends",
      members: "320",
    },
    {
      image: "/images/cardsImg/valorant.jpg",
      title: "Valorant",
      members: "280",
    },
    {
      image: "/images/cardsImg/fifa.png",
      title: "FIFA",
      members: "210",
    },
    {
      image: "/images/cardsImg/pubg.jpg",
      title: "PUBG",
      members: "190",
    },
  ];

  /* ===============================
     State
  ================================ */

  const [activeIndex, setActiveIndex] = useState(2);

  const startX = useRef(0);

  /* ===============================
     Drag Logic
  ================================ */

  const handleStart = (e) => {
    startX.current = e.touches
      ? e.touches[0].clientX
      : e.clientX;
  };

  const handleEnd = (e) => {

    const endX = e.changedTouches
      ? e.changedTouches[0].clientX
      : e.clientX;

    const distance = startX.current - endX;

    if (distance > 60) moveNext();
    if (distance < -60) movePrev();
  };

  const moveNext = () => {
    setActiveIndex((prev) =>
      (prev + 1) % arenas.length
    );
  };

  const movePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? arenas.length - 1 : prev - 1
    );
  };

  /* ===============================
     Position System
  ================================ */

  const getPositionClass = (i) => {

    const diff = i - activeIndex;

    if (diff === 0) return "center";

    if (diff === 1 || diff === -4) return "right1";

    if (diff === -1 || diff === 4) return "left1";

    if (diff === 2 || diff === -3) return "right2";

    if (diff === -2 || diff === 3) return "left2";

    return "";
  };

  /* ===============================
     Render
  ================================ */

  return (
    <Section>

      <Title>
        استكشف الساحات
      </Title>

      {/* Floating Elements */}
      <Floating>

        <Keyboard src="/images/img3D/keyboard.png" />

        <GameStick src="/images/img3D/gameStick.png" />

        <Headphone src="/images/img3D/headphone.png" />

        <WarTools src="/images/img3D/warTools.png" />

        <Triangle src="/images/shapes/triangle.png" />

        <Circle src="/images/shapes/circle.png" />

      </Floating>

      {/* Cards Stack */}
      <Stack
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
      >

        {arenas.map((arena, i) => (

          <CardWrap
            key={i}
            className={getPositionClass(i)}
          >
            <HomeCard {...arena} />
          </CardWrap>

        ))}

      </Stack>

    </Section>
  );
}
