'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { handleGoogleUser } from '../../../services/GoogleService';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const result = await handleGoogleUser(user);

      if (result.isNew) {
        router.push('/profile?firstLogin=true');
      } else {
        router.push('/');
      }
    };

    run();
  }, []);

  return <main className="min-h-screen bg-[#061125] flex items-center justify-center opacity-60 text-white font-['Cairo']">
        <p className="animate-pulse text-2xl">جاري تسجيل الدخول ...</p>
      </main>;
}
