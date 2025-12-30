// prisma/deploy-and-seed.js
const { exec } = require('child_process');

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    const process = exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(error);
      console.log(stdout);
      console.error(stderr);
      resolve();
    });
  });
}

async function main() {
  try {
    console.log('Running migrations...');
    await runCommand('npx prisma migrate deploy');

    console.log('Seeding database...');
    await runCommand('npx prisma db seed');

    console.log('✅ Migrations and seed completed!');
  } catch (err) {
    console.error('Error in deploy-and-seed:', err);
    process.exit(1);
  }
}

main();
