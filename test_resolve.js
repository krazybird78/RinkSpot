try {
    const pkg = require('tailwindcss/package.json');
    console.log('tailwindcss version:', pkg.version);
    console.log('tailwindcss resolved at:', require.resolve('tailwindcss'));
} catch (e) {
    console.error('Failed to resolve tailwindcss:', e.message);
    console.error('Stack:', e.stack);
}
