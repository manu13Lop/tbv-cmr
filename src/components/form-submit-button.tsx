'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormSubmitButtonProps extends React.ComponentProps<typeof Button> {
  loadingText?: string;
}

export function FormSubmitButton({
  children,
  loadingText,
  className,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(className, pending && 'cursor-not-allowed opacity-70')}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {loadingText || 'Enviando...'}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
