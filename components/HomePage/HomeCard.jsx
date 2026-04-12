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

  display: flex;
  flex-direction: column;

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
  padding: 16px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  color: white;
  text-align: center;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 900;
  margin-bottom: 6px;
  font-family: "Cairo", sans-serif;
`;

const Description = styled.p`
  font-size: 13px;
  color: rgba(255,255,255,0.75);
  line-height: 1.6;
  font-family: "Cairo", sans-serif;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* ===============================
   Button
================================ */

const ActionButton = styled.button`
  margin-top: 8px;

  width: 110px;
  padding: 6px 12px;

  border-radius: 999px;
  border: 1.4px solid #b37feb;

  background:
    linear-gradient(
      319deg,
      rgba(255,255,255,0.8) 11%,
      rgba(255,255,255,0.8) 34%,
      rgba(255,255,255,0) 66%,
      rgba(255,255,255,0.8) 94%
    ),
    ${({ $joined }) => ($joined ? "rgba(41,255,100,0.53)" : "#12082A")};

  background-blend-mode: soft-light, normal;

  box-shadow:
    0 2px 2px #000,
    0 0 16px ${({ $joined }) =>
      $joined ? "rgba(41,255,100,0.35)" : "rgba(146,84,222,0.32)"};

  color: #fff;
  font-family: "Cairo", sans-serif;
  font-size: 13px;
  font-weight: 900;

  cursor: pointer;
  transition: 0.25s ease;

  transform: translateY(-6px);

  &:hover {
    transform: translateY(-10px);
  }
`;

/* ===============================
   Component
================================ */

export default function HomeCard({
  image,
  title,
  description,
  buttonText = "انضم",
  isJoined = false,
  onAction,
  className = "",
}) {
  function handleButtonClick(e) {
    e.stopPropagation();
    if (onAction) onAction();
  }

  return (
    <Card className={className}>
      <ImageBox
        style={{
          backgroundImage: `url(${image || "/images/cardsImg/defaultArena.png"})`,
        }}
      />

      <Content>
        <div>
          <Title>{title}</Title>

          <Description>
            {description || "ساحة جاهزة لتجمع اللاعبين والتفاعل."}
          </Description>
        </div>

        <ActionButton
          type="button"
          onClick={handleButtonClick}
          $joined={isJoined}
        >
          {buttonText}
        </ActionButton>
      </Content>
    </Card>
  );
}