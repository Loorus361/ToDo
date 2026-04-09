import fs from 'node:fs';

const prompt = fs.readFileSync('issue-plan-prompt.txt', 'utf8');
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

if (!apiKey) {
  throw new Error('OPENAI_API_KEY secret is required for the issue plan workflow.');
}

const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'Return only the requested issue analysis in markdown. Do not include code fences.',
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt,
          },
        ],
      },
    ],
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
}

const data = await response.json();
const outputText = data.output_text?.trim();

if (!outputText) {
  throw new Error('OpenAI response did not include output_text.');
}

fs.writeFileSync('issue-plan-comment.md', outputText.endsWith('\n') ? outputText : `${outputText}\n`);
