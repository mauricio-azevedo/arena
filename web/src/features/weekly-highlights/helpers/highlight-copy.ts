import type { HighlightType } from '@/features/weekly-highlights/types/weekly-highlight.type';

// The card's hero line. Minimums in the spec keep every number plural.
export function highlightSentence(type: HighlightType, value: number): string {
  switch (type) {
    case 'WIN_STREAK_CURRENT':
      return `Está a ${value} partidas sem perder`;
    case 'WIN_STREAK_RECORD':
      return `Venceu ${value} seguidas`;
    case 'CLIMB':
      return `Subiu ${value} posições`;
    case 'LEADERSHIP':
      return 'Assumiu a liderança';
    case 'MILESTONE_MATCHES':
      return `Chegou às ${value} partidas`;
    case 'MILESTONE_WINS':
      return `Chegou a ${value} vitórias`;
  }
}
