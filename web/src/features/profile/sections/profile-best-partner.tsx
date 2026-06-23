import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nameInitial } from '@/lib/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Label, Meta, Overline } from '@/components/ui/text';
import { partnerRateTone } from '../helpers/partner-rate.helper';
import { firstNameOf } from '../helpers/profile-name.helper';
import type { ProfileSummaryPartner } from '../types/profile-summary-partner.type';
import { ProfileMonogram } from './profile-monogram';

export function ProfileBestPartner({
  partner,
  ownerLabel,
  ownerMonogram,
}: {
  partner: ProfileSummaryPartner;
  ownerLabel: string;
  ownerMonogram: string;
}) {
  const tone = partnerRateTone(partner.winRate);
  const partnerFirstName = firstNameOf(partner.displayName);

  return (
    <Card>
      <CardContent className="space-y-4">
        <Overline className="flex items-center gap-1.5 text-faint-foreground">
          <Star className="size-3.5 fill-current" strokeWidth={0} aria-hidden />
          Melhor dupla
        </Overline>

        <div className="flex items-center justify-between gap-3.5">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex">
              <ProfileMonogram className="size-[3.25rem] bg-gradient-to-br from-brand to-brand-muted text-stat-md ring-[3px] ring-background">
                {ownerMonogram}
              </ProfileMonogram>
              <ProfileMonogram className="-ml-4 size-[3.25rem] bg-muted text-stat-md text-foreground ring-[3px] ring-background">
                {nameInitial(partner.displayName)}
              </ProfileMonogram>
            </div>

            <div className="min-w-0">
              <Label className="block truncate font-display font-extrabold">
                {ownerLabel} &amp; {partnerFirstName}
              </Label>
              <Meta className="mt-0.5 block text-muted-foreground">
                {partner.winsTogether}–{partner.lossesTogether} juntos · {partner.matchesTogether}{' '}
                jogos
              </Meta>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className={cn('font-display text-stat-xl leading-none font-extrabold', tone.text)}>
              {partner.winRate}
              <span className="text-stat-sm">%</span>
            </div>
            <Overline size="xs" className="mt-1 text-faint-foreground">
              vitórias
            </Overline>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
