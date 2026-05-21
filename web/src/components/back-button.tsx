import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  href: string;
  label?: string;
};

export function BackButton({ href, label = 'Voltar' }: Props) {
  return (
    <Button asChild variant="ghost" size="sm" className="w-fit px-0">
      <Link href={href}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
