# Fixing Slow Filesystem Warning in Next.js

## Problem
Next.js is detecting slow filesystem operations on the `.next` directory, which can significantly slow down development.

## Root Causes

1. **Disk Space (Primary Issue)**: Your disk is at 93% capacity (411GB/466GB), which causes significant slowdowns
2. **Large .next Directory**: The `.next` directory is 1.8GB and contains thousands of small files
3. **Downloads Folder Location**: Projects in Downloads may be scanned more aggressively
4. **Antivirus Scanning**: Security software may be scanning `.next` directory in real-time

## Solutions

### 1. Free Up Disk Space (HIGHEST PRIORITY)
Your disk is 93% full. Free up at least 20-30GB:
- Empty Trash
- Remove large unused files
- Clear browser caches
- Remove old downloads
- Use Disk Utility to identify large files

### 2. Exclude Project from Antivirus Scanning
If you have antivirus software (like CleanMyMac, Norton, etc.):
- Add `/Users/javierperezgarcia/Downloads/vesta` to exclusions
- Specifically exclude the `.next` directory

### 3. Move Project to a Better Location
Consider moving the project out of Downloads:
```bash
# Move to a dedicated development folder
mv ~/Downloads/vesta ~/Development/vesta
# Or
mv ~/Downloads/vesta ~/Projects/vesta
```

### 4. Clean .next Directory
Regularly clean the build cache:
```bash
# Delete .next directory (it will be regenerated)
rm -rf .next

# Or add to package.json scripts:
# "clean": "rm -rf .next"
```

### 5. Configure Next.js for Better Performance
Add to `next.config.js`:
```javascript
const config = {
  // ... existing config
  experimental: {
    // Use faster filesystem operations
    optimizeCss: true,
    // Reduce file operations during development
    turbo: {
      resolveAlias: {
        // Add any specific optimizations
      }
    }
  },
  // Reduce build output
  onDemandEntries: {
    // Keep pages in memory longer
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};
```

### 6. Use Turbo Mode (Already Enabled)
You're already using `--turbo` flag in dev script, which is good.

### 7. Increase System Resources
- Close unnecessary applications
- Increase available RAM if possible
- Ensure SSD health is good (if using SSD)

## Quick Wins

1. **Free up 20GB+ disk space** - This will have the biggest impact
2. **Clean .next directory**: `rm -rf .next`
3. **Exclude from antivirus** - Prevents real-time scanning
4. **Move out of Downloads** - Better file system performance

## Verification

After applying fixes, the warning should disappear. If it persists:
- Check disk space is above 80% capacity
- Verify antivirus exclusions are working
- Monitor system performance during `next dev`



