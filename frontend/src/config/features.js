// Render disables mail-only workflows; local development keeps them available.
export const emailFeaturesEnabled = import.meta.env.VITE_EMAIL_FEATURES_ENABLED === 'true'
  || (import.meta.env.VITE_EMAIL_FEATURES_ENABLED !== 'false' && import.meta.env.DEV);
