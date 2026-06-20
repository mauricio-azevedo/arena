import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>CR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>BS</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>DL</AvatarFallback>
      </Avatar>
    </div>
  );
}
