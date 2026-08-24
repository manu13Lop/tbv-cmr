'use client';

import { useFormStatus } from 'react-dom';
import { useRef } from 'react';
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
  const submittedRef = useRef(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (pending || submittedRef.current) {
      e.preventDefault();
      return;
    }
    submittedRef.current = true;
  };

  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(className, pending && 'opacity-70')}
      onClick={handleClick}
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
