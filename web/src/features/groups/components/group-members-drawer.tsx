'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Label, Meta } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { avatarBgClass, nameInitial } from '@/lib/avatar';
import { resolveMemberName } from '@/lib/member-name';
import { StubClaimEmailPanel } from '@/features/members/components/stub-claim-email-panel';
import type { GroupMember } from '@/types/api';

type GroupMembersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  isAdmin: boolean;
  members: GroupMember[];
};

// Role label shown per member: admins, plain members, and stubs (jogadores sem conta,
// surfaced to users as "convidado").
function roleTag(member: GroupMember): { label: string; className: string } {
  if (member.userId === null) {
    return { label: 'Convidado', className: 'bg-tag-warn/15 text-tag-warn' };
  }
  if (member.role === 'ADMIN') {
    return { label: 'Admin', className: 'bg-brand/15 text-brand' };
  }
  return { label: 'Membro', className: 'bg-background text-muted-foreground' };
}

export function GroupMembersDrawer({
  open,
  onOpenChange,
  groupId,
  isAdmin,
  members,
}: GroupMembersDrawerProps) {
  // The "Convidar" shortcut opens the same email panel as the player profile drawer,
  // for whichever stub the admin tapped. Kept mounted so it animates out cleanly.
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<{ memberId: string; name: string } | null>(null);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined} size="fit">
        <DrawerHeader className="items-center pb-3 pt-1 text-center">
          <DrawerTitle>Membros</DrawerTitle>
          <Meta className="text-muted-foreground">{members.length} no grupo</Meta>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[30px] pt-1 [scrollbar-width:none]">
          <div className="overflow-hidden rounded-3xl bg-surface shadow-hairline">
            {members.map((member) => {
              const { fullName } = resolveMemberName(member);
              const isStub = member.userId === null;
              const tag = roleTag(member);

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 border-t border-divider px-4 py-3 first:border-t-0"
                >
                  <span
                    className={cn(
                      'flex size-[42px] shrink-0 items-center justify-center rounded-full text-meta font-extrabold',
                      isStub
                        ? 'border border-dashed border-border-accent text-muted-foreground'
                        : cn(
                            'text-foreground shadow-[inset_0_0_0_1px_var(--border)]',
                            avatarBgClass(member.id),
                          ),
                    )}
                    aria-hidden
                  >
                    {nameInitial(fullName)}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Label className="truncate text-foreground">{fullName}</Label>
                    {member.user?.email && (
                      <Meta className="truncate text-muted-foreground">{member.user.email}</Meta>
                    )}
                  </div>

                  {isStub && isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setInviteTarget({ memberId: member.id, name: fullName });
                        setInviteOpen(true);
                      }}
                      className="flex shrink-0 items-center gap-1.5 rounded-pill bg-brand px-3 py-1.5 text-brand-foreground shadow-button transition-opacity active:opacity-90"
                    >
                      <UserPlus className="size-3.5" strokeWidth={2.4} aria-hidden />
                      <span className="text-[11px] font-extrabold uppercase tracking-wide">
                        Convidar
                      </span>
                    </button>
                  ) : (
                    <span
                      className={cn(
                        'shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide',
                        tag.className,
                      )}
                    >
                      {tag.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DrawerNested open={inviteOpen} onOpenChange={setInviteOpen}>
          <DrawerContent aria-describedby={undefined} size="fit">
            {inviteTarget && (
              <StubClaimEmailPanel
                groupId={groupId}
                memberId={inviteTarget.memberId}
                stubName={inviteTarget.name}
                onBack={() => setInviteOpen(false)}
              />
            )}
          </DrawerContent>
        </DrawerNested>
      </DrawerContent>
    </Drawer>
  );
}
