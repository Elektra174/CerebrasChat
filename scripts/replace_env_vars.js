// scripts/replace_env_vars.js
const fs = require('node:fs');
const path = require('node:path');

// Resolve paths relative to the script's location to ensure it works correctly
// when called from package.json scripts (which usually run from project root).
const projectRoot = path.resolve(__dirname, '..');
const buildDistDir = path.join(projectRoot, 'build', 'dist');

// Get API_KEY from the build environment (where this script runs)
const apiKeyFromEnv = process.env.API_KEY;

function replaceInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Determine the replacement string:
        // If API_KEY is a string in the build env, it becomes a string literal in client JS.
        // If API_KEY is undefined in the build env, it becomes the 'undefined' literal in client JS.
        const replacementValue = typeof apiKeyFromEnv === 'string' 
            ? JSON.stringify(apiKeyFromEnv) // "your_api_key" (includes quotes)
            : 'undefined';                 // undefined (the literal)

        // Use a global regex to replace all occurrences
        const regex = /process\.env\.API_KEY/g;
        
        if (regex.test(content)) { // Check if replacement is needed
            content = content.replace(regex, replacementValue);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Replaced 'process.env.API_KEY' in ${path.relative(projectRoot, filePath)} with ${replacementValue}`);
        }

    } catch (err) {
        console.error(`Error processing file ${path.relative(projectRoot, filePath)}:`, err);
        // Set exit code to indicate failure, so build process can be aware
        if (!process.exitCode || process.exitCode === 0) {
            process.exitCode = 1; 
        }
    }
}

function walkDirAndReplace(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            walkDirAndReplace(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            replaceInFile(fullPath);
        }
    }
}

if (!fs.existsSync(buildDistDir)) {
    console.error(`Build output directory ${buildDistDir} not found. Ensure 'tsc' has compiled files to the correct 'outDir'.`);
    process.exitCode = 1; 
} else {
    console.log(`Scanning for .js files in ${buildDistDir} to replace 'process.env.API_KEY'...`);
    walkDirAndReplace(buildDistDir);
    
    if (process.exitCode === 1) {
        console.error("Environment variable replacement script finished with errors.");
    } else {
        console.log("Environment variable replacement script finished successfully.");
    }
}
