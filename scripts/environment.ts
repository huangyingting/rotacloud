for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile?.(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
