const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = require(packageJsonPath);

// Get the admin path from environment variable or use default
// S'assurer que le chemin se termine toujours par un slash
let adminPath = process.env.ADMIN_PATH || '/manager';
if (!adminPath.endsWith('/')) {
    adminPath = adminPath + '/';
}
console.log('Using admin path with trailing slash:', adminPath);

// Update homepage if it doesn't match the desired path
if (packageJson.homepage !== adminPath) {
    packageJson.homepage = adminPath;
    
    // Write back to package.json
    fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + '\n'
    );
    
    console.log(`Updated homepage in package.json to ${adminPath}`);
} else {
    console.log(`Homepage already set to ${adminPath}`);
} 