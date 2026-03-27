"use client";

import styled, { keyframes } from "styled-components";

/* ===============================
   Animation
================================ */

const float = keyframes`
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-12px); }
  100% { transform: translateY(0); }
`;

/* ===============================
   Container
================================ */

const Highlight = styled.section`
  position: relative;

  width: 100%;
  min-height: 520px;

  margin: 0;

  border: 8px solid #ff27f0;
  border-radius: 14px;

  background: #061125;

  overflow: visible;

  display: flex;
  justify-content: center;
  align-items: center;
`;

/* ===============================
   Lights
================================ */

const PinkLight = styled.span`
  position: absolute;

  top: 30px;
  right: 140px;
`;

const GreenLight = styled.span`
  position: absolute;

  bottom: 10px;
  left: 140px;
`;

/* ===============================
   Shapes
================================ */

const Square = styled.img`
  position: absolute;

  width: 30px;
  height: 36px;

  filter: blur(2px);

  bottom: 180px;
  right: 260px;

  animation: ${float} 7s ease-in-out infinite;
`;

const Circle = styled.img`
  position: absolute;

  width: 22px;

  top: 80px;
  right: 350px;

  filter: blur(1.5px);

  animation: ${float} 9s ease-in-out infinite;
`;


const Triangle = styled.img`
  position: absolute;

  width: 29.75px;
  height: 35.84px;

  filter: blur(2px);

  top: 120px;
  left: 200px;

  animation: ${float} 6s ease-in-out infinite;
`;

/* ===============================
   Wrapper
================================ */

const Wrapper = styled.div`
  width: 100%;
  max-width: 1500px;

  display: flex;
  flex-direction: row-reverse;

  justify-content: space-between;
  align-items: center;

  padding: 0 80px;

  position: relative;
  z-index: 3;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 25px;
    padding: 40px 20px;
  }
`;

/* ===============================
   Text
================================ */

const Text = styled.div`
  width: 380px;

  text-align: right;
  color: white;

  font-family: "Cairo", sans-serif;

  margin-top: -40px;

  @media (max-width: 900px) {
    text-align: center;
    width: auto;
    margin-top: 0;
  }

  h2 {
    font-size: 67px;
    font-weight: 400;
    line-height: 100px;

    @media (max-width: 900px) {
      font-size: 40px;
      line-height: 55px;
    }
  }
`;

const Bold = styled.h2`
  font-size: 67px;
  font-weight: 900;
  line-height: 100px;

  text-shadow: 0 3px 0 #ff27f0;

  @media (max-width: 900px) {
    font-size: 40px;
    line-height: 55px;
  }
`;

/* ===============================
   Button
================================ */

const Button = styled.button`
  margin-top: 24px;
  width: 180px;
  padding: 8px 16px;
  border-radius: 10px;

  transition: all 0.25s ease;

  border: 1.4px solid #b37feb;

  background:
    linear-gradient(
      319deg,
      rgba(255,255,255,0.8) 11%,
      rgba(255,255,255,0.8) 34%,
      rgba(255,255,255,0) 66%,
      rgba(255,255,255,0.8) 94%
    ),
    #12082a;

  background-blend-mode: soft-light, normal;

  box-shadow:
    0 2px 2px #000,
    0 0 16px rgba(146, 84, 222, 0.32);

  cursor: pointer;

  &:hover {
    transform: translateY(-6px) scale(1.02);

    box-shadow:
      0 6px 8px #000,
      0 0 24px rgba(146, 84, 222, 0.6);
  }

  &:active {
    transform: translateY(-2px) scale(0.98);

    box-shadow:
      0 2px 4px #000,
      0 0 10px rgba(146, 84, 222, 0.4);
  }

  span {
    color: #fff;

    font-family: Cairo;
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
  }
`;

/* ===============================
   Image
================================ */

const ImageBox = styled.div`
  position: relative;
  z-index: 2;

  img {
    width: 70vw;
    max-width: 1150px;
    min-width: 650px;

    height: auto;

    transform: translateY(-180px) translateX(60px);

    filter: drop-shadow(0 30px 55px rgba(0,0,0,0.7));

    position: relative;
    z-index: 5;
  }

  @media (max-width: 900px) {
    img {
      width: 90vw;
      max-width: 420px;

      transform: translateY(-60px);
    }
  }
`;

/* ===============================
   Component
================================ */

export default function HighlightSection() {
  return (
    <Highlight>

      {/* Lights */}
      <PinkLight />
      <GreenLight />

      {/* Shapes */}
      <Triangle src="/images/shapes/triangle.png" alt="triangle" />
      <Square src="/images/shapes/square.png" alt="square" />
      <Circle src="/images/shapes/circle.png"  alt="circle" />

      {/* Content */}
      <Wrapper>

        <Text>
          <h2>جاهـز يــبــدأ</h2>
          <Bold>الحــمــاس؟</Bold>

          <Button>
            <span> المبــاريــات</span>
          </Button>
        </Text>

        <ImageBox>
          <img src="/images/img3D/matchArena.png" alt="arena" />
        </ImageBox>

      </Wrapper>

    </Highlight>
  );
}
