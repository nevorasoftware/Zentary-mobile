const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'adapters',
  'react',
  'permissions',
  'PermissionsService.kt'
);

try {
  if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8');
    if (content.includes('return requestedPermissions.contains(permission)')) {
      content = content.replace(
        'return requestedPermissions.contains(permission)',
        'return requestedPermissions?.contains(permission) == true'
      );
      fs.writeFileSync(targetFile, content, 'utf8');
      console.log('✅ Successfully patched PermissionsService.kt for Android SDK 36');
    } else {
      console.log('ℹ️ PermissionsService.kt already patched or pattern not found');
    }
  } else {
    console.log('⚠️ PermissionsService.kt not found at expected path:', targetFile);
  }
} catch (err) {
  console.error('❌ Error patching PermissionsService.kt:', err);
}
