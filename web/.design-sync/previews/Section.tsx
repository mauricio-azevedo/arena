import { Section } from '@/components/ui/text';

export function SectionHeader() {
  return (
    <div className="flex flex-col gap-4">
      <Section>Hoje</Section>
      <Section>Ranking</Section>
    </div>
  );
}
