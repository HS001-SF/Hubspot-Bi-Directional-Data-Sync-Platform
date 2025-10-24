import * as React from 'react';

type ToastProps = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = React.useCallback((props: ToastProps) => {
    // Simple console implementation for now
    if (props.variant === 'destructive') {
      console.error(`${props.title}: ${props.description}`);
    } else {
      console.log(`${props.title}: ${props.description}`);
    }

    // You can enhance this with a proper toast UI library later
    if (typeof window !== 'undefined') {
      alert(`${props.title}${props.description ? '\n' + props.description : ''}`);
    }
  }, []);

  return { toast };
}
