// "desde" line on the profile identity — month + year, e.g. "mar. 2024".
export function formatMemberSince(date: string): string {
  const parsed = new Date(date);
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(parsed);
  const year = parsed.getFullYear();

  return `${month} ${year}`;
}
