const { execSync } = require('child_process');

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: 'f:/delSchool Website/backend' });
} catch (e) {
  // tsc exits with 1 on compilation errors, which throws here
  console.log('Build failed with errors');
}
