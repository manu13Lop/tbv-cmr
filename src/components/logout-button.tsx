'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
      <LogOut className="size-4" />
      Cerrar sesión
    </Button>
  );
}
