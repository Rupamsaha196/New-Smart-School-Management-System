const fs = require('fs');
const readline = require('readline');

async function extract() {
    const fileStream = fs.createReadStream('C:/Users/RUPAM/.gemini/antigravity-ide/brain/da2ec7d9-6e7e-4844-af75-526625946137/.system_generated/logs/transcript.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const data = JSON.parse(line);
        if (data.step_index >= 720 && data.step_index <= 735) {
            console.log(`Step ${data.step_index} [${data.type} / ${data.source}]: ${data.content ? data.content.substring(0, 100) : ''}`);
        }
    }
}

extract();
