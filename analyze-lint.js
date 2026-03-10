const fs = require('fs');
const path = require('path');

try {
    let content = fs.readFileSync('lint_report.json', 'utf8');
    // Strip BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    const report = JSON.parse(content);
    const summary = {};
    const errorTypes = {};

    report.forEach(f => {
        if (f.errorCount > 0 || f.warningCount > 0) {
            // Extract the relative path from the project root
            const relativePath = path.relative(process.cwd(), f.filePath);
            const dir = relativePath.split(path.sep)[0];

            // Count errors by directory
            summary[dir] = (summary[dir] || 0) + f.errorCount + f.warningCount;

            // Count error types
            f.messages.forEach(msg => {
                errorTypes[msg.ruleId] = (errorTypes[msg.ruleId] || 0) + 1;
            });
        }
    });

    const output = `
--- Errors by Directory ---
${JSON.stringify(summary, null, 2)}

--- Top 10 Error Types ---
${JSON.stringify(Object.entries(errorTypes).sort((a, b) => b[1] - a[1]).slice(0, 10), null, 2)}
`;
    fs.writeFileSync('lint_summary.txt', output);
    console.log('Analysis written to lint_summary.txt');

} catch (err) {
    console.error('Error analyzing report:', err);
}
