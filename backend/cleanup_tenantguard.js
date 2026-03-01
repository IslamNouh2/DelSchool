const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('f:/delSchool Website/backend/src');
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Remove the import statement entirely
    content = content.replace(/import\s*{\s*TenantGuard\s*}\s*from\s*['"].*tenant\.guard['"];?\r?\n?/g, '');
    
    // Remove TenantGuard from @UseGuards() lists
    content = content.replace(/,\s*TenantGuard/g, '');
    content = content.replace(/TenantGuard\s*,?/g, '');
    
    // Clean up any empty @UseGuards() that might have resulted if TenantGuard was the only guard
    content = content.replace(/@UseGuards\(\s*\)/g, '');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Cleaned up:', file);
        modifiedCount++;
    }
}

console.log('Total files cleaned:', modifiedCount);
