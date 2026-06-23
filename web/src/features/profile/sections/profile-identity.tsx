import { nameInitial } from '@/lib/avatar';
import { Meta, Title } from '@/components/ui/text';
import { formatMemberSince } from '../helpers/profile-date-format.helper';
import { ProfileMonogram } from './profile-monogram';

export function ProfileIdentity({
  name,
  memberSince,
}: {
  name: string;
  memberSince: string | null | undefined;
}) {
  const since = formatMemberSince(memberSince);

  return (
    <div className="flex items-center gap-3.5">
      <ProfileMonogram className="size-[3.625rem] bg-gradient-to-br from-brand to-brand-muted text-stat-lg shadow-button">
        {nameInitial(name)}
      </ProfileMonogram>

      <div className="min-w-0 flex-1">
        <Title className="truncate text-stat-md">{name}</Title>
        {since && <Meta className="mt-0.5 block text-muted-foreground">desde {since}</Meta>}
      </div>
    </div>
  );
}
