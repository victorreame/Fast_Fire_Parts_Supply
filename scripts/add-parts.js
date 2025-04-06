const { spawn } = require('child_process');
const path = require('path');

// Function to execute a script and return a promise that resolves when the script completes
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running script: ${scriptPath}`);
    const process = spawn('tsx', [scriptPath], { stdio: 'inherit' });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
}

// Main function to run scripts sequentially
async function main() {
  try {
    // First seed the parts in the database
    await runScript(path.join(__dirname, '../server/seed-parts.ts'));
    
    // Then generate SVG files for the parts
    await runScript(path.join(__dirname, '../server/generate-part-svgs.ts'));
    
    console.log('All scripts completed successfully! Added 100 parts, with 50 marked as best sellers.');
  } catch (error) {
    console.error('Error running scripts:', error);
    process.exit(1);
  }
}

// Run the main function
main();