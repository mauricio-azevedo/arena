import { buildPrBrief } from '../brief/build.js';
import { renderBriefMarkdown } from '../brief/render-markdown.js';
import { fetchPrSnapshot } from '../github/client.js';

async function main() {
  const [command, repository, prNumberText] = process.argv.slice(2);

  if (command !== 'brief' || !repository || !prNumberText) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const prNumber = Number(prNumberText);

  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    console.error('PR number must be a positive integer.');
    process.exitCode = 1;
    return;
  }

  const snapshot = await fetchPrSnapshot(repository, prNumber);
  const brief = buildPrBrief(snapshot);
  console.log(renderBriefMarkdown(brief));
}

function printUsage() {
  console.error('Usage: npm run brief -- owner/repo 123');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
