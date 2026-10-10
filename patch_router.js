const fs = require('fs');
let content = fs.readFileSync('api/legal-router.ts', 'utf8');

// 1. Add withRetry helper
if (!content.includes('function withRetry')) {
    const withRetry = `
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  throw new Error("Unreachable");
}
`;
    content = content.replace('function formatSize(bytes: number): string {', withRetry + '\nfunction formatSize(bytes: number): string {');
}

// 2. Update ANALYZE_SYSTEM_PROMPT
content = content.replace(
  '4. A list of key contractual risks/provisions found.',
  '4. A list of key contractual risks/provisions found.\n   Enforce strict grounding: You MUST cite exact page/paragraph references from uploaded documents. If there is no clear evidence in the text, explicitly state "Insufficient operational evidence provided" instead of guessing.'
);

// 3. Wrap generateObject
content = content.replace(
  /const result = await generateObject\(\{([\s\S]*?)\}\);/g,
  'const result = await withRetry(() => generateObject({$1}));'
);

// 4. Wrap generateText
content = content.replace(
  /const result = await generateText\(\{([\s\S]*?)\}\);/g,
  'const result = await withRetry(() => generateText({$1}));'
);

fs.writeFileSync('api/legal-router.ts', content);
