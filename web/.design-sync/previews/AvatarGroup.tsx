import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';

// Stacked players — the dupla / group-member treatment from the match cards.
export function Dupla() {
  return (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>CR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>BS</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  );
}

export function WithOverflow() {
  return (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>CR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>BS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>DL</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+5</AvatarGroupCount>
    </AvatarGroup>
  );
}
