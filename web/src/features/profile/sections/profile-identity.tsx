import { MemberAvatar } from '@/components/ui/member-avatar';
import { Meta, Title } from '@/components/ui/text';
import { formatMemberSince } from '../helpers/profile-date-format.helper';

export function ProfileIdentity({
  userId,
  firstName,
  lastName,
  nickname,
  avatarColor,
  memberSince,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  nickname: string | null | undefined;
  avatarColor: string | null | undefined;
  memberSince: string | null | undefined;
}) {
  const name = `${firstName} ${lastName}`.trim();
  const since = formatMemberSince(memberSince);
  // Handle line: apelido when set, then the "desde …" join.
  const handle = [nickname?.trim() || null, since ? `desde ${since}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex items-center gap-comfortable">
      <MemberAvatar userId={userId} name={name} avatarColor={avatarColor ?? null} size="xl" />

      <div className="min-w-0 flex-1">
        <Title className="truncate text-stat-md">{name}</Title>
        {/* mt-0.5: 2px optical nudge tucking the handle under the Title — not layout spacing. */}
        {handle && <Meta className="mt-0.5 block text-muted-foreground">{handle}</Meta>}
      </div>
    </div>
  );
}
