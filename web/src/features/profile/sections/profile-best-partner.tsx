import { cn } from '@/lib/utils';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Heading, Label, Meta, Overline } from '@/components/ui/text';
import { partnerRateTone } from '../helpers/partner-rate.helper';
import { firstNameOf } from '../helpers/profile-name.helper';
import type { ProfileSummaryPartner } from '../types/profile-summary-partner.type';

export function ProfileBestPartner({
  partner,
  ownerLabel,
  ownerUserId,
  ownerName,
  ownerAvatarColor,
}: {
  partner: ProfileSummaryPartner;
  ownerLabel: string;
  ownerUserId: string;
  ownerName: string;
  ownerAvatarColor: string | null | undefined;
}) {
  const tone = partnerRateTone(partner.winRate);
  const partnerFirstName = firstNameOf(partner.displayName);
  const ringClass = 'ring-[3px] ring-background';

  return (
    <section className="space-y-comfortable">
      <Heading className="px-1">Melhor dupla</Heading>
      <Card>
        <CardContent>
          <div className="flex items-center justify-between gap-comfortable">
            <div className="flex min-w-0 items-center gap-base">
              <div className="flex">
                <MemberAvatar
                  userId={ownerUserId}
                  name={ownerName}
                  avatarColor={ownerAvatarColor ?? null}
                  size="lg"
                  className={ringClass}
                />
                <MemberAvatar
                  userId={partner.userId}
                  name={partner.displayName}
                  avatarColor={partner.avatarColor}
                  size="lg"
                  className={cn('-ml-4', ringClass)}
                />
              </div>

              <div className="min-w-0">
                <Label className="block truncate font-display font-extrabold">
                  {ownerLabel} &amp; {partnerFirstName}
                </Label>
                {/* mt-0.5: 2px optical nudge tucking the Meta under the Label — not layout spacing. */}
                <Meta className="mt-0.5 block text-muted-foreground">
                  {partner.winsTogether}–{partner.lossesTogether} juntos · {partner.matchesTogether}{' '}
                  jogos
                </Meta>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div
                className={cn('font-display text-stat-xl leading-none font-extrabold', tone.text)}
              >
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
    </section>
  );
}
