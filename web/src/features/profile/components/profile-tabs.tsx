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
    <div className="br-liquid-glass br-hairline grid grid-cols-4 rounded-[1.85rem] p-1.5 text-xs font-semibold">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`br-pressable rounded-[1.4rem] px-2 py-2.5 transition-all ${
            activeTab === tab.value
              ? 'bg-foreground text-background shadow-[0_12px_28px_color-mix(in_oklch,var(--foreground)_18%,transparent)]'
              : 'text-muted-foreground hover:bg-white/45 hover:text-foreground dark:hover:bg-white/10'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
