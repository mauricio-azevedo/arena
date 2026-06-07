export function summarizeChangedAreas(paths: string[]) {
  const directories = new Map<string, number>();

  for (const path of paths) {
    const parts = path.split('/');
    const key = parts.length >= 3 ? parts.slice(0, 3).join('/') : parts.slice(0, -1).join('/') || path;
    directories.set(key, (directories.get(key) ?? 0) + 1);
  }

  const topAreas = [...directories.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([directory, count]) => `${directory} (${count})`);

  if (topAreas.length === 0) {
    return 'No changed files were reported.';
  }

  return `Most changed areas: ${topAreas.join(', ')}.`;
}
