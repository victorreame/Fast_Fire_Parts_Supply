const { exec } = require('child_process');

// Run the drizzle-kit command to push schema changes
exec('npx drizzle-kit push:pg', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing drizzle-kit: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`drizzle-kit stderr: ${stderr}`);
    return;
  }
  
  console.log(`drizzle-kit push successful: ${stdout}`);
});