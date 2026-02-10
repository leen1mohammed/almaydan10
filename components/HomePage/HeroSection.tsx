import styled, { keyframes } from "styled-components";

/* ===============================
   Animation
================================ */

const float = keyframes`
  0% {
    transform: translateY(0) rotate(0);
  }

  50% {
    transform: translateY(-15px) rotate(5deg);
  }

  100% {
    transform: translateY(0) rotate(0);
  }
`;

/* ===============================
   Main Container
================================ */

const Hero = styled.section`
  width: 100%;
  min-height: 650px;

  background: radial-gradient(
    circle at top right,
    rgba(41, 255, 100, 0.2),
    #061125 60%
  );

  position: relative;
  overflow: hidden;

  display: flex;
  justify-content: center;
  align-items: center;

  padding: 60px;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 40px 20px;
  }
`;

/* ===============================
   Effects
================================ */

const Effects = styled.div`
  position: absolute;
  inset: 0;

  z-index: 1;
  pointer-events: none;
`;

/* ===============================
   Lights
================================ */

const GreenLight = styled.span`
  position: absolute;

  width: 220px;
  height: 220px;

  background: rgba(41, 255, 100, 0.25);
  filter: blur(70px);

  top: -40px;
  right: 160px;
`;

const GreenLight2 = styled.span`
  position: absolute;

  width: 250px;
  height: 250px;

  background: rgba(41, 255, 100, 0.18);
  filter: blur(90px);

  bottom: -80px;
  left: 120px;
`;

const PinkLight = styled.span`
  position: absolute;

  width: 320px;
  height: 320px;

  background: rgba(255, 39, 240, 0.22);
  filter: blur(70px);

  bottom: 100px;
  right: 220px;
`;

const PinkLight2 = styled.span`
  position: absolute;

  width: 280px;
  height: 280px;

  background: rgba(255, 39, 240, 0.18);
  filter: blur(80px);

  top: 140px;
  left: 220px;
`;

/* ===============================
   Shapes
================================ */

const Triangle = styled.img`
  position: absolute;

  width: 35px;

  top: 130px;
  left: 180px;

  filter: blur(1.5px);

  animation: ${float} 6s ease-in-out infinite;
`;

const Square = styled.img`
  position: absolute;

  width: 32px;

  bottom: 210px;
  right: 280px;

  filter: blur(1.5px);

  animation: ${float} 7s ease-in-out infinite;
`;

const Circle = styled.img`
  position: absolute;

  width: 20px;

  top: 260px;
  right: 420px;

  filter: blur(2px);

  animation: ${float} 5s ease-in-out infinite;
`;

/* ===============================
   Wrapper
================================ */

const Wrapper = styled.div`
  width: 100%;
  max-width: 1200px;

  display: flex;
  flex-direction: row-reverse;

  align-items: center;
  justify-content: space-between;

  gap: 60px;

  position: relative;
  z-index: 2;

  @media (max-width: 900px) {
    gap: 30px;
  }
`;

/* ===============================
   Logo
================================ */

const LogoBox = styled.div`
  img {
    width: 420px;
    max-width: 100%;
    height: auto;

    object-fit: contain;
  }

  @media (max-width: 900px) {
    img {
      width: 260px;
    }
  }
`;

/* ===============================
   Content
================================ */

const Content = styled.div`
  max-width: 450px;
  text-align: right;
`;

const Title = styled.h1`
  color: #dadada;

  font-size: 64px;
  font-weight: 900;

  text-shadow: 0 3px 0 #ff27f0;

  @media (max-width: 900px) {
    font-size: 42px;
  }
`;

const Desc = styled.p`
  margin-top: 20px;

  color: white;

  font-size: 22px;
  line-height: 1.6;

  @media (max-width: 900px) {
    font-size: 18px;
  }
`;

/* ===============================
   Component
================================ */

export default function HeroSection() {
  return (
    <Hero>

      {/* Background Effects */}
      <Effects>

        {/* Lights */}
        <GreenLight />
        <GreenLight2 />

        <PinkLight />
        <PinkLight2 />

        {/* Shapes */}
        <Triangle src="/images/triangle.png" alt="" />
        <Square src="/images/square.png" alt="" />
        <Circle src="/images/circle.png" alt="" />

      </Effects>

      {/* Main Content */}
      <Wrapper>

        <LogoBox>
          <img src="/images/almaydanLogo.svg" alt="logo" />
        </LogoBox>

        <Content>
          <Title>الميدان</Title>

          <Desc>
            موقع صُمّم لعشّاق الرياضـــات الإلكترونية، يجمع شغف المنافســة،
            صخــب البطــولات، وحماس الجماهير.
          </Desc>
        </Content>

      </Wrapper>

    </Hero>
  );
}
