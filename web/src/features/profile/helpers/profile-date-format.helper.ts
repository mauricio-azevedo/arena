export function formatProfileRelativeDate(date: string | null) {
  if (!date) {
    return 'sem partidas';
  }

  const diffInMs = Date.now() - new Date(date).getTime();
  const diffInMinutes = Math.max(1, Math.floor(diffInMs / 1000 / 60));

  if (diffInMinutes < 60) {
    return 'hoje';
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return 'hoje';
  }

  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays === 1) {
    return 'ontem';
  }

  if (diffInDays < 7) {
    return `há ${diffInDays} dias`;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
}
