const fs = require('fs');
const path = require('path');

// 1. Patch PermissionsService.kt in expo-modules-core for Android SDK 36 nullable Array
const permissionsServiceFile = path.join(
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
  if (fs.existsSync(permissionsServiceFile)) {
    let content = fs.readFileSync(permissionsServiceFile, 'utf8');
    if (content.includes('return requestedPermissions.contains(permission)')) {
      content = content.replace(
        'return requestedPermissions.contains(permission)',
        'return requestedPermissions?.contains(permission) == true'
      );
      fs.writeFileSync(permissionsServiceFile, content, 'utf8');
      console.log('✅ Successfully patched PermissionsService.kt for Android SDK 36');
    } else {
      console.log('ℹ️ PermissionsService.kt already patched or pattern not found');
    }
  } else {
    console.log('⚠️ PermissionsService.kt not found at expected path:', permissionsServiceFile);
  }
} catch (err) {
  console.error('❌ Error patching PermissionsService.kt:', err);
}

// 2. Patch ScreenStack.kt in react-native-screens for Kotlin removeLast() incompatibility in Android 15
const screenStackFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-screens',
  'android',
  'src',
  'main',
  'java',
  'com',
  'swmansion',
  'rnscreens',
  'ScreenStack.kt'
);

try {
  if (fs.existsSync(screenStackFile)) {
    let content = fs.readFileSync(screenStackFile, 'utf8');
    if (content.includes('drawingOpPool.removeLast()')) {
      content = content.replace(
        'drawingOpPool.removeLast()',
        'drawingOpPool.removeAt(drawingOpPool.lastIndex)'
      );
      fs.writeFileSync(screenStackFile, content, 'utf8');
      console.log('✅ Successfully patched ScreenStack.kt for Android 15 / Kotlin compatibility');
    } else {
      console.log('ℹ️ ScreenStack.kt already patched or pattern not found');
    }
  } else {
    console.log('⚠️ ScreenStack.kt not found at expected path:', screenStackFile);
  }
} catch (err) {
  console.error('❌ Error patching ScreenStack.kt:', err);
}
