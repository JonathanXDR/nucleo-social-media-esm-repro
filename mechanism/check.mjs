// Minimal, license-free demonstration of the same Node ESM resolution failure.
// broken.js omits the file extension and fails, fixed.js adds it and works.
async function attempt(label, specifier) {
  try {
    await import(specifier);
    console.log(`${label}: imported OK`);
  } catch (error) {
    console.log(`${label}: ${error.code}`);
  }
}

await attempt('broken (no extension)', './broken.js');
await attempt('fixed  (with .js)    ', './fixed.js');
