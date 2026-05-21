type ProfileTab = 'summary' | 'matches' | 'groups' | 'stats';

type Props = {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

const tabs: Array<{ value: ProfileTab; label: string }> = [
  { value: 'summary', label: 'Resumo' },
  { value: 'matches', label: 'Partidas' },
  { value: 'groups', label: 'Grupos' },
  { value: 'stats', label: 'Estatísticas' },
];

export function ProfileTabs({ activeTab, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 rounded-xl border bg-muted/30 p-1 text-xs font-medium">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-lg px-2 py-2 ${
            activeTab === tab.value ? 'bg-background shadow-sm' : 'text-muted-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
