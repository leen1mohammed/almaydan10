/* eslint-disable react-hooks/purity */
'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { arenaService } from '@/services/arenaService';
import { authService } from '@/services/authService';
import { supabase } from '../../../lib/supabase';
import "../../globals.css";
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';

export default function ArenaDetailsPage() {

  const { arenaName } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [arenaData,setArenaData]=useState(null);
  const decodedName = decodeURIComponent(arenaName);
  const [role,setRole]=useState(null);
  const reactionsList = ['☹️', '😂', '👍🏻', '❤️', '🔥'];
  const [messageReactions, setMessageReactions] = useState({}); // { messageId: { emoji: count, userReacted: true } }
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [playPop] = useSound('/sounds/reaction-pop.mp3', { volume: 0.5 });
  const [playSwordEntrance] = useSound('/sounds/sword-entrance.mp3', { volume: 0.4 });
  // أضيفي هذا الـ State في بداية المكون
  const [otherArenasBubbles, setOtherArenasBubbles] = useState([
  { id: 1, top: '60%', side: 'left', color: '#29FF64' },
  { id: 2, top: '80%', side: 'right', color:'#FF27F0' },
  { id: 3, top: '70%', side: 'left', color: '#00CCFF' },
  { id: 4, top: '90%', side: 'right', color:'#FF891B' },
  ]);
  
  

  // مصفوفة الألوان الخمسة اللي طلبتيها لمربعات الرسائل
  const bubbleColors = [
    'rgba(255, 137, 27, 0.33)', // برتقالي
    'rgba(41, 255, 100, 0.20)', // أخضر نيون
    'rgba(255, 39, 240, 0.20)', // وردي
    'rgba(179, 127, 235, 0.30)', // بنفسجي
    'rgba(0, 204, 255, 0.20)'   // أزرق سماوي
  ];


  const getTopWords = (msgs) => {
  const commonWords = ['من', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'اللي', 'كان', 'وش', 'أنا','الله']; 
  const counts = {};

  msgs.forEach(m => {
     if(m&&m.body){
      const words = m.body.split(/\s+/);
      words.forEach(w => {
      const clean = w.trim().replace(/[^\u0621-\u064A]/g, ''); // تنظيف الكلمة (حروف عربية فقط)
        if (clean.length > 2 && !commonWords.includes(clean)) {
          counts[clean] = (counts[clean] || 0) + 1;
      }
    });
  }
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // نأخذ أهم 8 كلمات فقط عشان ما تزدحم الساحة
};


  const formatMessageDate = (dateString) => {
  if (dateString === 'الآن') return 'الآن';
  
  const msgDate = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - msgDate) / 60000);

  if (diffInMinutes < 1) return 'الآن';
  if (diffInMinutes < 60) return` منذ ${diffInMinutes} د`;
  
  // بعد ساعة يظهر التاريخ فقط
  return msgDate.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
};

const handleReactionToggle = async (messageId, emoji) => {
  if (!user) return;

  playPop();
  
  // 1. تحديث الواجهة فوراً (Optimistic UI)
  setMessages((prevMessages) =>
    prevMessages.map((msg) => {
      if (msg.id === messageId) {
        const currentReactions = msg.reactions?.[emoji] || [];
        const hasReacted = currentReactions.some(r => r.PUserName === user.userName);

        const updatedReactions = hasReacted
          ? currentReactions.filter(r => r.PUserName !== user.userName)
          : [...currentReactions, { PUserName: user.userName, reaction: emoji }];

        return {
          ...msg,
          reactions: { ...msg.reactions, [emoji]: updatedReactions }
        };
      }
      return msg;
    })
  );

  // 2. إطلاق الانفجار فوراً عند الكل (قبل انتظار الداتابيز)
  supabase.channel(`arena:${decodedName}`).send({
    type: 'broadcast',
    event: 'emoji_burst',
    payload: { emoji, messageId }
  });
  triggerFloatingEmoji(emoji);

  // 3. تحديث الداتابيز (مرة واحدة فقط!)
  try {
    await arenaService.toggleReaction(messageId, emoji, user.userName, decodedName);
  } catch (error) {
    console.error("فشل التفاعل في الداتابيز:", error);
    // هنا ممكن تسوين تراجع (Rollback) للـ state لو حابة
  }
};

const triggerFloatingEmoji = (emoji) => {
  const burstCount = 8; // 👈 نطلق 8 حبات في المرة الواحدة لحماس أكثر!
  const newEmojis = [];

  for (let i = 0; i < burstCount; i++) {
    newEmojis.push({
      id: Date.now() + i,
      emoji: emoji,
      // توزيع عشوائي يملأ أطراف الشاشة يمين ويسار
      xOffset: Math.random() > 0.5 
        ? Math.random() * 400 + 300   // المنطقة اليمنى
        : -(Math.random() * 400 + 300) // المنطقة اليسرى
    });
  }

  setFloatingEmojis(prev => [...prev, ...newEmojis]);

  // تنظيفهم بعد 4 ثواني
  setTimeout(() => {
    setFloatingEmojis(prev => prev.filter(e => !newEmojis.find(ne => ne.id === e.id)));
  }, 4000);
};

 useEffect(() => {
  const loadInitialMessages = async () => {
    const decodedName = decodeURIComponent(arenaName);
    const currentUser = await authService.getCurrentUser();
    if (!currentUser){
      router.replace('/login')
      return;
    }
    setUser(currentUser);
    // جلب بيانات الساحة نفسها عشان ناخذ الصورة
    const allArenas = await arenaService.getAllArenas();
    const currentArena = allArenas.find(a => a.name === decodedName);
    setArenaData(currentArena);


    const userRole= await authService.getUserRole(currentUser.userName);
      setRole(userRole)
      console.log("تم التعرف على المستخدم",currentUser.userName,"بدور:",userRole);

    const data = await arenaService.getArenaContent(decodedName);
    setMessages(data);
    playSwordEntrance();
     };
     loadInitialMessages();

     // 2. تفعيل القناة اللحظية (Chat + Emoji Burst)
  const channel = supabase
    .channel(`arena:${decodedName}`  , {
      config: {
        broadcast: { self: true }, // 👈 هذي تخلي الإشارة توصل للكل بما فيهم أنتِ
      },
    }) // استخدمنا اسم فريد للساحة

    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'ArenaItem', filter: `ArenaName=eq.${decodedName}` },
      async (payload) => {
        const newMsg = payload.new;
        const { data: prof } = await supabase
          .from('Profile')
          .select('profilePic')
          .eq('pruserName', newMsg.PUserName)
          .single();

        const newMessageWithProfile = {
          ...newMsg,
          Profile: prof
        };
        setMessages((current) => [newMessageWithProfile, ...current]);
      }
    )

  // 3. استقبال الإيموجي الطائر
  .on('broadcast', { event: 'emoji_burst' }, ({ payload }) => {
    playPop(); // 🔊 تشغيل الصوت عند الحساب الثاني لما يوصله الرياكشن
    triggerFloatingEmoji(payload.emoji);
  })
    .subscribe((status) => console.log("حالة الاتصال الحالية:", status));
    // تنظيف الاتصال عند إغلاق الصفحة
    return () => {
    supabase.removeChannel(channel);
    };
    }, [decodedName, playPop]);


  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      await arenaService.addArenaItem(decodedName, newMessage);
      setNewMessage("");
    } catch (error) 
    { console.error("فشل الارسال", error.message); }
  };

  const handleLeave = async () => {
  const confirmLeave = window.confirm("متأكد تبغى تغادر الساحة؟");
  
  if (confirmLeave) {
    try {
      // حركة الفزعة: لو الـ user لسه null، نحاول نجيبه مباشرة من السيرفس
      let currentUser = user;
      if (!currentUser) {
        currentUser = await authService.getCurrentUser();
      }

      if (!currentUser) {
        alert("يا بطل، النظام مو قادر يلقى حسابك. جرب تسجل دخول مرة ثانية.");
        router.push('/login');
        return;
      }

      const result = await arenaService.leaveArena(currentUser.userName, decodedName);
      
      if (result.success) {
        alert("تم الخروج بنجاح! ننتظرك ترجع لنا أقوى 🫡");
        router.push('/arena');
      }
    } catch (error) {
      console.error("خطأ تقني:", error.message);
    }
  }
};

useEffect(() => {
  const updateOtherActivity = async () => {
    try {
      // 1. جلب البيانات من السيرفس
      const recentMsgs = await arenaService.getOtherArenasMessages(decodedName);
      
      if (recentMsgs && recentMsgs.length > 0) {
        // 2. تحديث الفقاعات بمحتوى حقيقي
        setOtherArenasBubbles(prev => prev.map((bubble, index) => {
          // نوزع الرسايل اللي جت على الفقاعات الموجودة
          const msg = recentMsgs[index % recentMsgs.length];
          return {
            ...bubble,
            text: `في ساحة ${msg.ArenaName}: ${msg.body.substring(0, 30)}...`
          };
        }));
      }
    } catch (error) {
      console.error("فشل جلب نشاط الساحات:", error);
    }
  };

  // نشغلها أول ما تفتح الصفحة
  updateOtherActivity();

  // ونحدثها كل 30 ثانية عشان ما نضغط على الداتابيز
  const interval = setInterval(updateOtherActivity, 30000);
  return () => clearInterval(interval);
}, [decodedName]);

  return (
    <main className="min-h-screen w-full bg-[#061125] flex flex-col items-center">
      

      {/*<ParticlesBackground />*/}
      
      {/* 1. الهيدر (المواصفات: 1280x194px) */}
      <header 
        className="relative w-full max-w-[1440px] h-[140px] rounded-b-[30px] border-x border-b border-[#29FF64] flex items-center 
        justify-between px-10 overflow-hidden"
        style={{
          background: `linear-gradient(0deg, rgba(0, 0, 0, 0.00) -16.82%, #061125 95.81%), 
          linear-gradient(0deg, rgba(0, 0, 0, 0.62) 0%, rgba(0, 0, 0, 0.62) 100%),
           url(${arenaData?.pic}) lightgray -6.412px -678.032px / 101.002% 1050% no-repeat`,
          boxShadow: '0 6px 37.5px -15px #FF27F0'
        }}
      >
        <div className="flex flex-col gap-2">
        { role==='participant'&&(
           <button 
            onClick={handleLeave}
           className="w-[120px] py-1 border border-[#FF27F0] text-white rounded-full font-bold text-sm font-['Cairo']"
           >مغادرة
           </button>
           )}
        </div>
        <button onClick={() => router.back()} className="text-[#29FF64] font-bold font-['Cairo']"> السابق</button>
        
      </header>

      {/* فقاعات النيون الجانبية (أخبار الساحات الأخرى) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <p className="absolute top-100 left-10 text-white/40 font-['Cairo'] text-2xl font-black italic tracking-widest uppercase"
          style={{ 
          textShadow: '0 0 15px rgba(255, 39, 240, 0.3)', // توهج وردي خفيف
          lineHeight: '1'
        }}>
        رادار <br/>
        <span className="text-[#FF27F0] text-4xl shadow-pink-500/50">الميدان</span>
       
      </p>





          {/*<p className="absolute top-90 left-10 text-white/50 font-['Cairo'] text-2xl font-black italic tracking-wider"
          style={{ 
            textShadow: '0 0 10px rgba(255, 255, 255, 0.2)', // توهج خفيف يخليها "لايف"
            maxWidth: '250px', // عشان لو كبرت ما تمد بالعرض بزيادة
            lineHeight: '1.2'
          }}>
          وش قاعد يصير <br/> 
          <span className="text-[#29FF64] text-3xl">بالساحات الثانية؟</span>
        </p>*/}
          
  {otherArenasBubbles.map((bubble) => (
    <motion.div
      key={bubble.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: [0.2, 0.5, 0.2], 
        y: [0, -20, 0], // حركة طفو خفيفة
        scale: [1, 1.05, 1] 
      }}
      transition={{ 
        duration: 5 + Math.random() * 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className="absolute p-4 rounded-2xl border-[1px] backdrop-blur-sm"
      style={{
        top: bubble.top,
        [bubble.side]: '20px', // يثبتها على الجوانب (20 بكسل من الحافة)
        borderColor: bubble.color,
        boxShadow: `0 0 15px ${bubble.color}44`, // توهج خفيف
        backgroundColor: `${bubble.color}11`, // لون خلفية شفاف جداً
        maxWidth: '180px'
      }}
    >
      <span className="text-white font-['Cairo'] text-[12px] block text-center leading-tight opacity-80">
        {bubble.text}
      </span>
    </motion.div>
  ))}
</div>

    <div className="relative w-full max-w-[800px] h-[240px] mx-auto mt-2 mb-0 overflow-hidden flex justify-center items-center">
  {getTopWords(messages).map(([word, count], i) => {
    
    const neonColors = ['#B37FEB', '#29FF64', '#FF27F0', '#FF891B', '#00CCFF', '#FFD700'];

    const compactPositions = [
      { top: '40%', left: '42%' },
      { top: '28%', left: '32%' },
      { top: '50%', left: '25%' },
      { top: '35%', left: '55%' },
      { top: '55%', left: '48%' },
      { top: '22%', left: '45%' },
      { top: '65%', left: '35%' },
      { top: '45%', left: '60%' },
    ];

const isTop = i === 0;
let pos;

if (isTop) {
  pos = { top: '50%', left: '50%' };
} else {
  const perLayer = 4;
  const layer = Math.floor(i / perLayer);
  const indexInLayer = i % perLayer;

  const angle = (indexInLayer / perLayer) * 2 * Math.PI;

  // 🔥 نخليه أعرض أفقيًا
  const baseRadius = 100;
  const layerGap = 110;

 const sizeFactor = Math.max(1, count / 5);

const radiusX = (baseRadius + layer * layerGap) * sizeFactor + 4;
const radiusY = ((baseRadius + layer * layerGap) * 0.3) * sizeFactor;
  // 🔥 عشوائية خفيفة (تعطي شكل كلاود)
  const randomOffset = (Math.random() - 0.5) * 30;

  pos = {
    top: `calc(50% + ${Math.sin(angle) * radiusY + randomOffset}px)`,
    left: `calc(50% + ${Math.cos(angle) * radiusX + randomOffset}px)`
  };
}
    // ⭐ أهم كلمة
    return (
      <span 
        key={i}
        className="absolute font-['Cairo'] font-black transition-all duration-500 hover:scale-125 cursor-default select-none whitespace-nowrap"
        style={{ 
          top: pos.top,
          left: pos.left,

          // ⭐ الحل هنا
          transform: 'translate(-50%, -50%)',

          fontSize: `${isTop ? 80 : Math.min(72, 12 + count * 11)}px`,
          color: neonColors[i % neonColors.length],

          textShadow: isTop 
            ? `0 0 25px ${neonColors[i % neonColors.length]}`
            : `0 0 10px ${neonColors[i % neonColors.length]}`,

          animation: `
            float ${3 + i}s ease-in-out infinite,
            pulse ${2 + i * 0.3}s ease-in-out infinite
          `,

          zIndex: 10 - i,
        }}
      >
        {word}
      </span>
    );
  })}
</div>


      {/* 2. منطقة الرسائل (Grid تدرجات الألوان) */}
      <section className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10 mt-0" dir="rtl items-start">
  {messages.map((msg, index) => (
    <div 
      key={index}
      className="p-6 rounded-[30px] border-[1.4px] border-[#B37FEB] shadow-[0_0_16px_0_rgba(146,84,222,0.32)] flex flex-col text-right"
      style={{ 
        background: bubbleColors[index % 5],
        width: '314px', 
        height:'fit-content',
        minHeight: '150px' 
      }} >
      {/* الهيدر الصغير داخل الكرت */}
      <div className="flex items-center justify-between mb-4 flex-row-reverse">
        {/* الوقت على اليسار */}
        <span className="text-[#AFADAD] text-[12px] font-['Cairo']">
          {formatMessageDate(msg.created_at || 'الآن')}
        </span>
    
        {/* اليوزر والصورة على اليمين */}
        <div className="flex items-center gap-2 flex-row-reverse">
            <span className="text-white font-extrabold text-[14px] font-['Cairo']">
            @{msg.PUserName || 'لاعب_مجهول'}
          </span>
             <div className="w-[46px] h-[46px] rounded-full border border-[#FF27F0] overflow-hidden flex-shrink-0">
            <img 
              src={msg.Profile?.profilePic || "/images/avatar-default.png"} 
              className="w-full h-full object-cover" 
              alt="avatar"
            />
          </div>
          
          </div> </div>
      {/* محتوى الرسالة */}
      <p className="text-white text-right leading-relaxed font-['Cairo'] text-[15px] opacity-90 break-words 
      whitespace-pre-wrap flex-grow">
        {msg.body}
      </p>

      <div className="mt-4 flex flex-row-reverse justify-center gap-2 border-t border-white/10 pt-3">
  {reactionsList.map((emoji) => {
    // نتحقق هل اليوزر الحالي ضغط على هذا الرياكشن؟
    const hasReacted = msg.reactions?.[emoji]?.some(r => r.PUserName === user?.userName);
    const count = msg.reactions?.[emoji]?.length || 0;

    return (
      <button
        key={emoji}
        onClick={() => handleReactionToggle(msg.id, emoji)}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-300
          ${hasReacted 
            ? 'bg-white/20 scale-110 border border-[#FF27F0]/50' 
            : 'hover:bg-white/10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}
        `}
      >
        <span className="text-[16px]">{emoji}</span>
        {count > 0 && (
          <span className={`text-[10px] font-bold ${hasReacted ? 'text-white' : 'text-white/50'}`}>
            {count}
          </span>
        )}
      </button>
    );
  })}
</div>


    </div>))}</section>

      {/* 3. مربع البحث/الإرسال (المواصفات: 109px height) */}
      {role==='participant'&&(
      <footer className="fixed bottom-10 z-50">
        <form 
    onSubmit={(e) => {
      e.preventDefault();
      handleSend();
    }}
  >
        <div 
          className="flex items-center w-[1100px] h-[100px] px-8 rounded-[30px] border-[1.4px] border-[#B37FEB] shadow-[0_0_16px_0_rgba(146,84,222,0.32)]"
          style={{
            background: 'linear-gradient(319deg, rgba(255, 255, 255, 0.80) 11.46%, rgba(255, 255, 255, 0.80) 34.44%, rgba(255, 255, 255, 0.00) 66.52%, rgba(255, 255, 255, 0.80) 94.31%), #12082A',
            backgroundBlendMode: 'soft-light, normal'
          }}
        >
          <button type='submit' className="p-4 hover:scale-110 transition-transform text-[#29FF64] font-bold font-['Cairo']">
             ارسال
          </button>
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="شاركنا تعليقك........."
            className="flex-1 bg-transparent border-none text-right text-white text-[20px] font-medium font-['Cairo'] 
            outline-none placeholder:text-[#9D9D9D]"
          />
        </div>
        </form>
      </footer>
      )}

      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
  <AnimatePresence>
    {floatingEmojis.map((e) => (
      <motion.div
        key={e.id}
        initial={{ y: '100vh', opacity: 0, x: e.xOffset, scale: 0.5 }}
        animate={{ 
          y: '-10vh', // يطير من تحت لفوق تماماً
          opacity: [0, 1, 1, 0], // يظهر ثم يثبت ثم يتلاشى
          x: e.xOffset + (Math.random() * 50 - 25), // تمايل خفيف
          scale: [0.5, 1.5, 1.2],
          rotate: Math.random() * 40 - 20
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 4, ease: "linear" }}
        className="absolute left-1/2 text-5xl"
      >
        {e.emoji}
      </motion.div>
    ))}
  </AnimatePresence>
</div>
    </main>
  );
}