'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Body, Heading, Meta } from '@/components/ui/text';
import type { ProfileSummaryPartner } from '../types/profile-summary-partner.type';
import { PartnerRow } from './partner-row';

const INLINE_LIMIT = 3;

export function ProfilePartnersSection({
  partners,
  partnerCount,
}: {
  partners: ProfileSummaryPartner[];
  partnerCount: number;
}) {
  const [showAll, setShowAll] = useState(false);

  if (partners.length === 0) {
    return (
      <section className="space-y-3">
        <SectionHeader partnerCount={partnerCount} />
        <div className="rounded-card bg-card px-4 py-5 text-center shadow-card">
          <Body className="text-muted-foreground">
            Registre partidas para descobrir suas melhores duplas.
          </Body>
        </div>
      </section>
    );
  }

  const inline = partners.slice(0, INLINE_LIMIT);

  return (
    <section className="space-y-3">
      <SectionHeader partnerCount={partnerCount} />

      <div className="overflow-hidden rounded-card bg-card shadow-card">
        {inline.map((partner, index) => (
          <PartnerRow
            key={partner.userId ?? `${partner.displayName}-${index}`}
            partner={partner}
            divider={index > 0}
          />
        ))}

        {partnerCount > INLINE_LIMIT && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-border px-4 py-3.5 text-label font-bold text-brand transition-colors active:bg-foreground/[0.03]"
          >
            Ver todas as {partnerCount} duplas
            <ChevronRight className="size-4" strokeWidth={2.4} aria-hidden />
          </button>
        )}
      </div>

      <Drawer open={showAll} onOpenChange={setShowAll}>
        <DrawerContent>
          <DrawerHeader className="pt-2 pb-3">
            <DrawerTitle>Suas duplas</DrawerTitle>
            <DrawerDescription>{partnerCount} parceiros</DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="overflow-hidden rounded-card bg-card shadow-hairline">
              {partners.map((partner, index) => (
                <PartnerRow
                  key={partner.userId ?? `${partner.displayName}-${index}`}
                  partner={partner}
                  divider={index > 0}
                />
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function SectionHeader({ partnerCount }: { partnerCount: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <Heading>Suas duplas</Heading>
      <Meta className="text-muted-foreground">
        {partnerCount} {partnerCount === 1 ? 'parceiro' : 'parceiros'}
      </Meta>
    </div>
  );
}
