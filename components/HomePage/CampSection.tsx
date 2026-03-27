"use client";

import styled from "styled-components";
import {useRouter} from "next/navigation";

/* ===============================
   Wrapper
================================ */

const Wrapper = styled.section`
  position: relative;

  width: 100%;
  min-height: 100%;

  margin: 0;
  padding: 0;

  display: flex;
  justify-content: center;
  align-items: center;

  box-sizing: border-box;

  background:
    radial-gradient(
      circle at right top,
      rgba(26, 11, 58, 0.9),
      rgba(5, 11, 31, 0.9) 70%
    ),
    linear-gradient(
      180deg,
      #050b1f 0%,
      #070c25 50%,
      #050b1f 100%
    );
`;

/* ===============================
   Container
================================ */

const Container = styled.div`
  position: relative;

  width: 100%;
  max-width: 1280px;

  height: 457px;

  border-radius: 14px;
  border: 8px solid #29ff64;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 60px;

  box-sizing: border-box;

  overflow: visible;

  direction: rtl;

  background: radial-gradient(
    circle at right,
    #1a0b3a,
    #050b1f 70%
  );

  @media (max-width: 1300px) {
    width: 95%;
  }
`;

/* ===============================
   Chair
================================ */

const Chair = styled.div`
  position: absolute;

  left: 40px;
  bottom: -70px;

  width: 469px;
  height: 606px;

  z-index: 2;

  img {
    width: 100%;
    height: auto;

    filter: drop-shadow(
      24.669px 22.139px 48.706px rgba(72, 6, 107, 0.4)
    );
  }
`;

/* ===============================
   Content
================================ */

const Content = styled.div`
  margin-right: 80px;

  text-align: right;

  z-index: 3;
`;

const Text1 = styled.p`
  color: #fff;

  font-family: Cairo;

  font-size: 67px;
  font-weight: 400;

  line-height: 100px;
`;

const Text2 = styled.p`
  color: #fff;

  font-family: Cairo;

  font-size: 67px;
  font-weight: 900;

  line-height: 100px;

  text-shadow: 0 3px 0 #ff27f0;
`;

const Text3 = styled.p`
  margin-top: 8px;

  color: #fff;

  font-family: Cairo;

  font-size: 24px;
  font-weight: 600;

  line-height: 39px;
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

/* ==========

=====================
   Lights
================================ */

const LightBase = styled.span`
  position: absolute;

  border-radius: 50%;

  filter: blur(70.75px);

  z-index: 1;
`;

const Light1 = styled(LightBase)`
  width: 320px;
  height: 320px;

  background: rgba(255, 39, 240, 0.22);

  transform: rotate(48deg);

  left: 180px;
  top: 80px;
`;

const Light2 = styled(LightBase)`
  width: 287px;
  height: 290px;

  background: rgba(41, 255, 100, 0.25);

  transform: rotate(48deg);

  left: 260px;
  bottom: 60px;
`;

const Light3 = styled(LightBase)`
  width: 320px;
  height: 320px;

  background: rgba(255, 39, 240, 0.22);

  transform: rotate(-133deg);

  right: 120px;
  top: 100px;
`;

/* ===============================
   Component
================================ */

export default function CampSection() {
  return (
    <Wrapper>

      {/* Lights */}
      <Light1 />
      <Light2 />
      <Light3 />

      <Container>

        {/* Chair */}
        <Chair>
          <img
            src="/images/img3D/gamingChair.png"
            alt="Gaming Chair"
          />
        </Chair>

        {/* Content */}
        <Content>

          <Text1>ادخــل</Text1>

          <Text2>الـمـعـسـكـر</Text2>

          <Text3>حيث تصنع التحالفات ..</Text3>

          <Button >
            <span>الـمـعـسـكـر</span>
          </Button>

        </Content>

      </Container>

    </Wrapper>
  );
}
