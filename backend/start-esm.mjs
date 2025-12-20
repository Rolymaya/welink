// Start the NestJS application
// This wrapper allows ESM dependencies to work with CommonJS project
import('./dist/main.js').catch(err => {
    console.error('Failed to start application:', err);
    process.exit(1);
});
