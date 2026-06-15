import { UserRound } from 'lucide-react';
import { SignedOutCtaCard } from '@/features/auth/components/signed-out-cta-card';

export function ProfileSignedOutState() {
  return (
    <SignedOutCtaCard
      icon={UserRound}
      title="Entre para ver seu perfil"
      description="Histórico, grupos e desempenho ficam salvos na sua conta."
      redirectPath="/profile"
      primaryAction="login"
    />
  );
}
