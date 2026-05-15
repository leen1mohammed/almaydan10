"use client";
import React, { useState, useEffect } from 'react';
import { authService } from '@/services/authService'; // تأكدي من مسار السيرفس عندك

export default function Footer() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = await authService.getCurrentUser();
      if (user?.userName) {
        const userRole = await authService.getUserRole(user.userName);
        setRole(userRole);
      }
    };
    fetchUserRole();
  }, []);

  /* روابط الصفحات */
  const allLinks = [
    { name: "اسأل حميدان", href: "/homidan" },
    { name: "حول", href: "/about" },
    { name: "الساحة", href: "/arena" },
    { name: "المعسكر", href: "/camp" },
    { name: "المباريات", href: "/matches" },
    { name: "الآن", href: "/live" },
  ];

  /* فلترة الروابط: إذا كان أدمن، نحذف "المعسكر" */
  const links = allLinks.filter(link => {
    if (role === 'admin' && link.name === "المعسكر") {
      return false;
    }
    return true;
  });

  /* أيقونات السوشيال */
  const socials = [
    {
      icon: "/images/icons/linkedin.svg",
      alt: "LinkedIn",
      href: "https://www.linkedin.com/company/113112978",
    },
    {
      icon: "/images/icons/facebook.svg",
      alt: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61572160743216",
    },
    {
      icon: "/images/icons/instagram.svg",
      alt: "Instagram",
      href: "https://www.instagram.com/almaydanapp",
    },
    {
      icon: "/images/icons/xApp.svg",
      alt: "X",
      href: "https://x.com/mydanapp",
    },
    {
      icon: "/images/icons/youtube.svg",
      alt: "YouTube",
      href: "https://www.youtube.com/channel/UCvIB6oOuSEdYwOc94MJV9-Q",
    },
  ];

  return (
    <footer className="footer">
      <div className="top">
        <nav className="links">
          {links.map((link, index) => (
            <a key={index} href={link.href} className="link">
              {link.name}
            </a>
          ))}
        </nav>

        <div className="logo">
          <img src="/images/logos/almaydanFooter.svg" alt="Almaydan footer" />
        </div>

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

      <div className="copyRight">
        Almaydan © 2026. All rights reserved.
      </div>

      <style jsx>{`
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

        .top {
          width: 100%;
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
        }

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

        .logo {
          display: flex;
          justify-content: center;
        }

        .logo img {
          width: 195px;
          height: auto;
        }

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

        .copyRight {
          margin-top: 24px;
          text-align: center;
          color: #fff;
          font-family: cairo, sans-serif;
          font-size: 14px;
          font-weight: 500;
          opacity: 0.85;
        }

        @media (max-width: 900px) {
          .top {
            grid-template-columns: 1fr;
            gap: 25px;
            text-align: center;
          }
          .socials, .links {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}