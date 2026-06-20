// Imports nucleo-social-media to show it cannot load under Node ESM.
// The package is installed with scripts disabled (see .npmrc), so it needs no
// Nucleo license. The defect lives in the published tarball, not behind the
// license gate.
const target = 'nucleo-social-media';

try {
  await import(target);
  console.log(`UNEXPECTED: "${target}" imported successfully, the bug did not reproduce.`);
  process.exit(1);
} catch (error) {
  console.log(`REPRODUCED: importing "${target}" failed under Node ${process.version}.`);
  console.log(`  code:    ${error.code}`);
  console.log(`  message: ${error.message.split('\n')[0]}`);
  process.exit(error.code === 'ERR_MODULE_NOT_FOUND' ? 0 : 2);
}
