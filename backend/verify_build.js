const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: 'f:/delSchool Website/backend' });
  console.log("Build successful!");
} catch (e) {
  console.log('Build failed');
  process.exit(1);
}
