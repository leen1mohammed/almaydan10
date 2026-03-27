"use client";

import styled from "styled-components";

/* ===============================
   Main Card
================================ */

const Card = styled.div`
  width: 390px;
  height: 440px;

  border-radius: 30px;
  border: 1px solid #29ff64;

  background: #061125;

  overflow: hidden;

  box-shadow: 0 6px 37px -15px #ff27f0;

  transition: 0.4s ease;

  &.active {
    filter: blur(0);
    transform: scale(1.05);
    z-index: 5;
  }

  &.blur {
    filter: blur(3px);
    opacity: 0.6;
  }
`;

/* ===============================
   Image
================================ */

const ImageBox = styled.div`
  height: 60%;

  background-size: cover;
  background-position: center;
`;

/* ===============================
   Content
================================ */

const Content = styled.div`
  height: 40%;
  padding: 20px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  color: white;

  h3 {
    font-size: 18px;
    font-weight: 900;
    margin-bottom: 10px;
  }
`;

/* ===============================
   Avatars (if used later)
================================ */

const Avatars = styled.div`
  display: flex;
  gap: -10px;
  margin: 8px 0;

  img {
    width: 32px;
    height: 32px;

    border-radius: 50%;
    border: 2px solid #ff27f0;
  }
`;

/* ===============================
   Count
================================ */

const Count = styled.span`
  font-size: 14px;
  color: #8e8888;
`;

/* ===============================
   Component
================================ */

export default function HomeCard({ image, title, members, className = "" }) {
  return (
    <Card className={className}>

      {/* Image */}
      <ImageBox
        style={{ backgroundImage: `url(${image})` }}
      />

      {/* Content */}
      <Content>

        <h3>{title}</h3>

        <Count>
          {members}
        </Count>

      </Content>

    </Card>
  );
}
