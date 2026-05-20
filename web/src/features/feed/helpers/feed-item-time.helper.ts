export function formatFeedItemTime(date: string) {
  const diffInMs = Date.now() - new Date(date).getTime();
  const diffInMinutes = Math.max(1, Math.floor(diffInMs / 1000 / 60));

  if (diffInMinutes < 60) {
    return `há ${diffInMinutes}min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `há ${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays === 1) {
    return 'ontem';
  }

  return `há ${diffInDays}d`;
}
