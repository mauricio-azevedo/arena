import { cn } from '@/lib/utils';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Label, Meta } from '@/components/ui/text';
import { partnerRateTone } from '../helpers/partner-rate.helper';
import { firstNameOf } from '../helpers/profile-name.helper';
import type { ProfileSummaryPartner } from '../types/profile-summary-partner.type';

export function PartnerRow({
  partner,
  divider,
}: {
  partner: ProfileSummaryPartner;
  // Top hairline that separates this row from the one above it in a list.
  divider?: boolean;
}) {
  const tone = partnerRateTone(partner.winRate);
  const firstName = firstNameOf(partner.displayName);

  return (
    <div className={cn('flex items-end gap-base px-4 py-3', divider && 'border-t border-border')}>
      <MemberAvatar
        userId={partner.userId}
        name={partner.displayName}
        avatarColor={partner.avatarColor}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-tight">
          <Label className="truncate font-bold">{firstName}</Label>
          {partner.currentRank != null && (
            <Meta className="shrink-0 text-faint-foreground">#{partner.currentRank}</Meta>
          )}
        </div>

        <div className="mt-snug flex items-center gap-snug">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className={cn('h-full rounded-full', tone.bar)}
              style={{ width: `${partner.winRate}%` }}
            />
          </div>
          <Meta className="min-w-[2.5rem] shrink-0 text-right text-muted-foreground">
            {partner.winsTogether}–{partner.lossesTogether}
          </Meta>
        </div>
      </div>

      <div
        className={cn(
          'w-14 shrink-0 text-right font-display text-stat-md font-extrabold tabular-nums',
          tone.text,
        )}
      >
        {partner.winRate}
        <span className="text-[0.6875rem]">%</span>
      </div>
    </div>
  );
}
