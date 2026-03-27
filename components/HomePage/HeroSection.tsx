"use client";

export default function HeroSection() {
  return (
    <>
      <section className="hero">

        {/* Background Effects */}
        <div className="effects">

          {/* Lights */}
          <span className="greenLight"></span>
          <span className="greenLight2"></span>

          <span className="pinkLight"></span>
          <span className="pinkLight2"></span>

          {/* Shapes */}
          <img
            src="/images/shapes/triangle.png"
            className="triangle"
            alt=""
          />

          <img
            src="/images/shapes/square.png"
            className="square"
            alt=""
          />

          <img
            src="/images/shapes/circle.png"
            className="circle"
            alt=""
          />

        </div>

        {/* Main Content */}
        <div className="wrapper">

          <div className="logoBox">
            <img src="/images/logos/almaydanLogo.svg" alt="logo" />
          </div>

          <div className="content">
            <h1 className="title">الميدان</h1>

            <p className="desc">
              موقع صُمّم لعشّاق الرياضـــات الإلكترونية، يجمع شغف المنافســة،
              صخــب البطــولات، وحماس الجماهير.
            </p>
          </div>

        </div>
      </section>

      <style jsx>{`
        /* ===============================
           Hero Container
        ================================ */

        .hero {
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
        }

        /* ===============================
           Background Effects
        ================================ */

        .effects {
          position: absolute;
          inset: 0;

          z-index: 1;
          pointer-events: none;
        }

        /* ===============================
           Lights
        ================================ */

        .greenLight {
          position: absolute;
          width: 220px;
          height: 220px;
          background: rgba(41, 255, 100, 0.25);
          filter: blur(70px);
          top: -40px;
          right: 160px;
        }

        .greenLight2 {
          position: absolute;
          width: 250px;
          height: 250px;
          background: rgba(41, 255, 100, 0.18);
          filter: blur(90px);
          bottom: -80px;
          left: 120px;
        }

        .pinkLight {
          position: absolute;
          width: 320px;
          height: 320px;
          background: rgba(255, 39, 240, 0.22);
          filter: blur(70px);
          bottom: 100px;
          right: 220px;
        }

        .pinkLight2 {
          position: absolute;
          width: 280px;
          height: 280px;
          background: rgba(255, 39, 240, 0.18);
          filter: blur(80px);
          top: 140px;
          left: 220px;
        }

        /* ===============================
           Floating Animation
        ================================ */

        @keyframes float {
          0% {
            transform: translateY(0) rotate(0);
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
          }
          100% {
            transform: translateY(0) rotate(0);
          }
        }

        /* ===============================
           Shapes
        ================================ */

        .triangle {
          position: absolute;
          width: 35px;
          top: 130px;
          left: 180px;
          filter: blur(1.5px);
          animation: float 6s ease-in-out infinite;
        }

        .square {
          position: absolute;
          width: 32px;
          bottom: 210px;
          right: 280px;
          filter: blur(1.5px);
          animation: float 7s ease-in-out infinite;
        }

        .circle {
          position: absolute;
          width: 20px;
          top: 260px;
          right: 420px;
          filter: blur(2px);
          animation: float 5s ease-in-out infinite;
        }

        /* ===============================
           Main Wrapper
        ================================ */

        .wrapper {
          width: 100%;
          max-width: 1200px;

          display: flex;
          flex-direction: row-reverse;

          align-items: center;
          justify-content: space-between;

          gap: 60px;

          position: relative;
          z-index: 2;
        }

        /* ===============================
           Logo
        ================================ */

        .logoBox img {
          width: 420px;
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }

        /* ===============================
           Text Content
        ================================ */

        .content {
          max-width: 450px;
          text-align: right;
          font-family: cairo;
        }

        .title {
          color: #dadada;
          font-size: 64px;
          font-weight: 900;
          font-family: cairo;
          text-shadow: 0 3px 0 #ff27f0;
        }

        .desc {
          margin-top: 20px;
          color: white;
          font-size: 22px;
          font-family: cairo;
          line-height: 1.6;
        }

        /* ===============================
           Responsive
        ================================ */

        @media (max-width: 900px) {

          .hero {
            padding: 40px 20px;
          }

          .wrapper {
            gap: 30px;
          }

          .logoBox img {
            width: 260px;
          }

          .title {
            font-size: 42px;
          }

          .desc {
            font-size: 18px;
          }

        }

      `}</style>
    </>
  );
}
