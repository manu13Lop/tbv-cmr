'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    const confirmed = window.confirm('¿Cerrar sesión?');
    if (!confirmed) return;
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={handleLogout}
      disabled={loading}
    >
      <LogOut className="size-4" />
      Cerrar sesión
    </Button>
  );
}
