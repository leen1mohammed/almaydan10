export default function Glow() {
  return (
    // أضفنا w-screen عشان ياخذ عرض الشاشة كامل، و h-full عشان الطول
    <div className="absolute inset-0 z-0 pointer-events-none opacity-70 flex justify-center items-end">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="100%"  // غيرنا الرقم لـ 100%
        height="100%" // غيرنا الرقم لـ 100%
        viewBox="0 0 1280 632" 
        preserveAspectRatio="none" // هذي تخلي الـ SVG يمط نفسه على كبر الشاشة
        fill="none"
        className="min-w-[150vw]" // يخليه أعرض من الشاشة شوي عشان ما يبين له حواف
      >
        <g filter="url(#filter0_f_610_9844)">
          <path d="M-35.4991 398.945C-102.299 442.545 -63.3324 790.445 -35.4991 958.945L1349 980.445V500.945C1315.17 474.279 1227.9 436.945 1149.5 500.945C1051.5 580.945 818.501 496.945 582.001 362.445C345.501 227.945 48.0009 344.445 -35.4991 398.945Z" fill="#722ED1"/>
        </g>
        <defs>
          <filter id="filter0_f_610_9844" x="-372.383" y="0" width="2021.38" height="1280.45" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood floodOpacity={0} result="BackgroundImageFix"/>
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
            <feGaussianBlur stdDeviation="150" result="effect1_foregroundBlur_610_9844"/>
          </filter>
        </defs>
      </svg>
    </div>
  );
}