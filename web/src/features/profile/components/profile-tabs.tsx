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
    <div className="grid grid-cols-4 rounded-[1.65rem] border bg-card/70 p-1.5 text-xs font-semibold shadow-sm backdrop-blur-sm">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-[1.25rem] px-2 py-2.5 transition-all ${
            activeTab === tab.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
