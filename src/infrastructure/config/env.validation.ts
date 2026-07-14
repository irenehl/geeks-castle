export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const projectId = config.FIREBASE_PROJECT_ID;
  if (typeof projectId !== 'string' || projectId.trim() === '') {
    throw new Error('FIREBASE_PROJECT_ID is required');
  }

  const useEmulator = config.FIREBASE_USE_EMULATOR;
  if (useEmulator !== undefined && useEmulator !== 'true' && useEmulator !== 'false') {
    throw new Error('FIREBASE_USE_EMULATOR must be "true" or "false"');
  }

  if (useEmulator === 'false') {
    const clientEmail = config.FIREBASE_CLIENT_EMAIL;
    const privateKey = config.FIREBASE_PRIVATE_KEY;
    if (typeof clientEmail !== 'string' || clientEmail.trim() === '') {
      throw new Error(
        'FIREBASE_CLIENT_EMAIL is required when FIREBASE_USE_EMULATOR=false',
      );
    }
    if (typeof privateKey !== 'string' || privateKey.trim() === '') {
      throw new Error(
        'FIREBASE_PRIVATE_KEY is required when FIREBASE_USE_EMULATOR=false',
      );
    }
  }

  const port = config.PORT;
  if (port !== undefined && port !== '') {
    const parsed = Number(port);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      throw new Error('PORT must be an integer between 1 and 65535');
    }
  }

  return config;
}
