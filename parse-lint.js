const fs = require('fs');
const fileContent = fs.readFileSync(process.argv[2], 'utf8');
const data = JSON.parse(fileContent);
for (const file of data) {
  for (const msg of file.messages) {
    if (msg.ruleId === '@typescript-eslint/no-explicit-any') {
      console.log(`${file.filePath}:${msg.line}:${msg.column} - any`);
    } else if (msg.ruleId === '@typescript-eslint/no-unused-vars') {
      console.log(`${file.filePath}:${msg.line}:${msg.column} - unused`);
    }
  }
}
