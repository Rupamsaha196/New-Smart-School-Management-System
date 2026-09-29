const fs = require('fs');
const readline = require('readline');

async function extract() {
    const fileStream = fs.createReadStream('C:/Users/RUPAM/.gemini/antigravity-ide/brain/da2ec7d9-6e7e-4844-af75-526625946137/.system_generated/logs/transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.includes('"step_index":730')) {
            const data = JSON.parse(line);
            if (data.tool_calls && data.tool_calls.length > 0) {
                const content = data.tool_calls[0].args.CodeContent;
                fs.writeFileSync('scratch/draft_report_full.md', content, 'utf8');
                console.log('Extracted FULL CodeContent, len:', content.length);
            }
            break;
        }
    }
}

extract();
