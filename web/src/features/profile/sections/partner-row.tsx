import { cn } from '@/lib/utils';
import { nameInitial } from '@/lib/avatar';
import { Label, Meta } from '@/components/ui/text';
import { partnerRateTone } from '../helpers/partner-rate.helper';
import { firstNameOf } from '../helpers/profile-name.helper';
import type { ProfileSummaryPartner } from '../types/profile-summary-partner.type';
import { ProfileMonogram } from './profile-monogram';

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
    <div className={cn('flex items-center gap-3 px-4 py-3', divider && 'border-t border-border')}>
      <ProfileMonogram className="size-[2.625rem] bg-muted text-stat-sm text-muted-foreground">
        {nameInitial(partner.displayName)}
      </ProfileMonogram>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <Label className="truncate font-bold">{firstName}</Label>
          {partner.currentRank != null && (
            <Meta className="shrink-0 text-faint-foreground">#{partner.currentRank}</Meta>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className={cn('h-full rounded-full', tone.bar)}
              style={{ width: `${partner.winRate}%` }}
            />
          </div>
          <Meta className="shrink-0 text-muted-foreground">
            {partner.winsTogether}–{partner.lossesTogether}
          </Meta>
        </div>
      </div>

      <div
        className={cn('shrink-0 text-right font-display text-stat-md font-extrabold', tone.text)}
      >
        {partner.winRate}
        <span className="text-[0.6875rem]">%</span>
      </div>
    </div>
  );
}
