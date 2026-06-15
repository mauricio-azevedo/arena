import { ProfileTab } from '@/features/profile/types/profile-tab.type';

type Props = {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

const tabs: Array<{ value: ProfileTab; label: string }> = [
  { value: 'summary', label: 'Resumo' },
  { value: 'matches', label: 'Partidas' },
  { value: 'groups', label: 'Grupos' },
];

export function ProfileTabs({ activeTab, onChange }: Props) {
  return (
    <div className="br-liquid-glass br-hairline grid grid-cols-3 rounded-[1.85rem] p-1.5 text-sm font-semibold">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            aria-pressed={isSelected}
            className={`br-pressable flex min-h-12 items-center justify-center rounded-[1.45rem] px-2 transition-all ${
              isSelected
                ? 'bg-foreground text-background shadow-[0_12px_28px_color-mix(in_oklch,var(--foreground)_18%,transparent)]'
                : 'text-muted-foreground hover:bg-white/45 hover:text-foreground dark:hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
