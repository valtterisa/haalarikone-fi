import { signOutAction } from '@/lib/auth-actions';
import { Button } from '@/components/ui/button';

export function SignOutButton({ label }: { label: string }) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline">
        {label}
      </Button>
    </form>
  );
}
