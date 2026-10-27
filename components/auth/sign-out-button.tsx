'use client';

import { useRouter } from '@/i18n/routing';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
        router.push('/');
      }}
    >
      {label}
    </Button>
  );
}
