import { Fragment } from 'react';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Dot, Meta, Title } from '@/components/ui/text';
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
  // Handle line: apelido when set, then the "desde …" part, joined by a Dot.
  const handleParts = [nickname?.trim() || null, since ? `desde ${since}` : null].filter(Boolean);

  return (
    <div className="flex items-center gap-comfortable">
      <MemberAvatar userId={userId} name={name} avatarColor={avatarColor ?? null} size="xl" />

      <div className="min-w-0 flex-1">
        <Title className="truncate text-stat-md">{name}</Title>
        {/* mt-0.5: 2px optical nudge tucking the handle under the Title — not layout spacing. */}
        {handleParts.length > 0 && (
          <Meta className="mt-0.5 block text-muted-foreground">
            {handleParts.map((part, index) => (
              <Fragment key={index}>
                {index > 0 && <Dot />}
                {part}
              </Fragment>
            ))}
          </Meta>
        )}
      </div>
    </div>
  );
}
