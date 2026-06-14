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
    <div className="grid grid-cols-4 gap-1 text-xs font-medium">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          aria-current={activeTab === tab.value ? 'page' : undefined}
          className="min-h-11 px-2"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
