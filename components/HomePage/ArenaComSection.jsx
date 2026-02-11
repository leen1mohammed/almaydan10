"use client";

import styled, { keyframes } from "styled-components";

/* ===============================
   Data
================================ */

const comments = [
  {
    id: 1,
    user: "khwdh",
    text: "المباراة خيالية ابدعوا",
    avatar: "/images/avatars/avatar1.png",
    groupId: "g1",
  },
  {
    id: 2,
    user: "hdfuejsh",
    text: "حماااااااس",
    avatar: "/images/avatars/avatar2.png",
    groupId: "g2",
  },
  {
    id: 3,
    user: "rhfhk",
    text: "تنظيم رهيب",
    avatar: "/images/avatars/avatar3.png",
    groupId: "g3",
  },
  {
    id: 4,
    user: "mbcxss",
    text: "الجمهور حماسي",
    avatar: "/images/avatars/avatar4.png",
    groupId: "g4",
  },
  {
    id: 5,
    user: "jjxspl",
    text: "اللعبة تشد الاعصاب",
    avatar: "/images/avatars/avatar5.png",
    groupId: "g5",
  },
];

const loopData = [...comments, ...comments];

/* ===============================
   Animations
================================ */

const moveLeft = keyframes`
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
`;

const moveRight = keyframes`
  from {
    transform: translateX(-50%);
  }
  to {
    transform: translateX(0);
  }
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
`;

/* ===============================
   Title
================================ */

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

  @media (max-width: 900px) {
    font-size: 40px;
    width: auto;
    text-align: center;
  }
`;

/* ===============================
   Rows
================================ */

const Row = styled.div`
  width: 100%;

  overflow-x: hidden;
  overflow-y: visible;

  margin: 15px 0;
`;

/* ===============================
   Tracks
================================ */

const TrackBase = styled.div`
  display: flex;
  gap: 24px;

  width: max-content;

  white-space: nowrap;

  will-change: transform;
`;

const TrackLeft = styled(TrackBase)`
  animation: ${moveLeft} 18s linear infinite;
`;

const TrackRight = styled(TrackBase)`
  animation: ${moveRight} 18s linear infinite;
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
      rgba(255,255,255,0) 66%,
      rgba(255,255,255,0.8) 94%
    ),
    #12082a;

  background-blend-mode: soft-light, normal;

  box-shadow:
    0 2px 2px #000,
    0 0 16px rgba(146,84,222,.32);

  flex-shrink: 0;

  @media (max-width: 900px) {
    width: 300px;
    height: auto;
  }
`;

/* ===============================
   Avatar
================================ */

const Avatar = styled.img`
  width: 81px;
  height: 81px;

  border-radius: 50%;

  object-fit: cover;
`;

/* ===============================
   Text
================================ */

const TextBox = styled.div`
  display: flex;
  flex-direction: column;

  text-align: right;
`;

const Comment = styled.p`
  width: 167px;

  color: #fff;

  font-family: Cairo;

  font-size: 20px;
  font-weight: 600;
  line-height: 36px;

  text-align: right;
`;

const Username = styled.span`
  width: 73px;

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
   Lights
================================ */

const LightBase = styled.span`
  position: absolute;

  border-radius: 50%;

  filter: blur(70px);

  z-index: 1;
`;

const Light1 = styled(LightBase)`
  width: 300px;
  height: 300px;

  background: rgba(255,39,240,0.22);

  top: 40px;
  left: 120px;
`;

const Light2 = styled(LightBase)`
  width: 260px;
  height: 260px;

  background: rgba(41,255,100,0.25);

  bottom: 40px;
  right: 180px;
`;

const Light3 = styled(LightBase)`
  width: 280px;
  height: 280px;

  background: rgba(255,39,240,0.22);

  top: 140px;
  right: 120px;
`;

/* ===============================
   Comment Card
================================ */

function CommentCard({ data }) {
  return (
    <Card>

      <Avatar
        src={data.avatar}
        alt={data.user}
      />

      <TextBox>

        <Comment>
          {data.text}
        </Comment>

        <Username>
          @{data.user}
        </Username>

      </TextBox>

    </Card>
  );
}

/* ===============================
   Component
================================ */

export default function ArenaComSection() {
  return (
    <Wrapper>

      {/* Title */}
      <Title>
        يحدث داخل الساحة
      </Title>

      {/* Top Row */}
      <Row>

        <TrackLeft>

          {loopData.map((item, index) => (
            <CommentCard
              key={index}
              data={item}
            />
          ))}

        </TrackLeft>

      </Row>

      {/* Bottom Row */}
      <Row>

        <TrackRight>

          {loopData.map((item, index) => (
            <CommentCard
              key={index}
              data={item}
            />
          ))}

        </TrackRight>

      </Row>

      {/* Lights */}
      <Light1 />
      <Light2 />
      <Light3 />

    </Wrapper>
  );
}
