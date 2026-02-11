"use client";

export default function Footer() {

  /* روابط الصفحات */
  const links = [
    { name: "اسأل حميدان", href: "#" },
    { name: "حول", href: "#" },
    { name: "الساحة", href: "#" },
    { name: "المعسكر", href: "#" },
    { name: "المباريات", href: "#" },
    { name: "الآن", href: "#" },
  ];


  /* أيقونات السوشيال */
  const socials = [
    {
      icon: "/images/icons/linkedin.svg",
      alt: "LinkedIn",
      href: "#",
    },
    {
      icon: "/images/icons/facebook.svg",
      alt: "Facebook",
      href: "#",
    },
    {
      icon: "/images/icons/instagram.svg",
      alt: "Instagram",
      href: "#",
    },
    {
      icon: "/images/icons/xApp.svg",
      alt: "X",
      href: "#",
    },
    {
      icon: "/images/icons/youtube.svg",
      alt: "YouTube",
      href: "#",
    },
  ];


  return (
    <footer className="footer">

      {/* الجزء العلوي */}
      <div className="top">

        {/* روابط الصفحات */}
        <nav className="links">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="link"
            >
              {link.name}
            </a>
          ))}
        </nav>


        {/* اللوقو */}
        <div className="logo">
          <img
            src="/images/logos/almaydanFooter.svg"
            alt="Almaydan footer"
          />
        </div>


        {/* أيقونات التواصل */}
        <div className="socials">
          {socials.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="socialItem"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={item.icon} alt={item.alt} />
            </a>
          ))}
        </div>

      </div>


      {/* حقوق النشر */}
      <div className="copyRight">
        Almaydan © 2026. All rights reserved.
      </div>



      {/* ================= CSS داخل نفس الملف ================= */}
      <style jsx>{`

        /* الحاوية الرئيسية */
        .footer {
          width: 100%;
          height: 212px;

          background: #061125;

          display: flex;
          flex-direction: column;
          justify-content: center;

          box-shadow:
            0 -2px 6px rgba(41,255,100,0.6),
            0 -4px 25px rgba(41,255,100,0.35),
            inset 0 1px 2px rgba(255,255,255,0.15);

          position: relative;
        }


        /* الجزء العلوي */
        .top {
          width: 100%;
          max-width: 1300px;

          margin: 0 auto;
          padding: 0 40px;

          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
        }


        /* أيقونات السوشيال */
        .socials {
          display: flex;
          gap: 16px;

          justify-content: flex-end;
        }

        .socialItem img {
          width: 26px;
          height: 26px;

          transition: 0.25s ease;
          opacity: 0.9;
        }

        .socialItem:hover img {
          transform: translateY(-3px) scale(1.1);
          opacity: 1;
        }


        /* اللوقو */
        .logo {
          display: flex;
          justify-content: center;
        }

        .logo img {
          width: 195px;
          height: auto;
        }


        /* روابط الصفحات */
        .links {
          display: flex;
          gap: 24px;

          justify-content: flex-start;
        }

        .link {
          color: #fff;

          font-family: cairo, sans-serif;
          font-size: 16px;
          font-weight: 500;

          text-decoration: none;

          transition: 0.25s ease;
        }

        .link:hover {
          color: #29ff64;
          text-shadow: 0 0 8px rgba(41,255,100,0.7);
        }


        /* حقوق النشر */
        .copyRight {
          margin-top: 24px;

          text-align: center;

          color: #fff;

          font-family: cairo, sans-serif;
          font-size: 14px;
          font-weight: 500;

          opacity: 0.85;
        }


        /* ريسبونسف */
        @media (max-width: 900px) {

          .top {
            grid-template-columns: 1fr;
            gap: 25px;
            text-align: center;
          }

          .socials,
          .links {
            justify-content: center;
          }

        }

      `}</style>

    </footer>
  );
}
