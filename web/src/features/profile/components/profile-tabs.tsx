import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from '@/features/profile/types/profile-tab.type';

type Props = {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

const tabs: Array<{ value: ProfileTab; label: string }> = [
  { value: 'summary', label: 'Resumo' },
  { value: 'matches', label: 'Partidas' },
  { value: 'groups', label: 'Grupos' },
  { value: 'stats', label: 'Stats' },
];

export function ProfileTabs({ activeTab, onChange }: Props) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onChange(value as ProfileTab)}>
      <TabsList className="grid h-auto w-full grid-cols-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="min-h-11 px-2 text-xs">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
