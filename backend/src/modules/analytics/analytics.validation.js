const { z } = require('zod');

const PUBLIC_PREFIXES = ['/', '/a-propos', '/projets', '/interventions', '/actualites', '/contact'];

function isPublicPath(value) {
  return PUBLIC_PREFIXES.some((prefix) => (
    prefix === '/' ? value === '/' : value === prefix || value.startsWith(`${prefix}/`)
  ));
}

const publicPath = z.string()
  .trim()
  .min(1)
  .max(240)
  .regex(/^\/[a-zA-Z0-9/_-]*$/, 'Chemin public invalide')
  .refine(isPublicPath, 'Chemin public non pris en charge');

const track = z.object({
  event_type: z.enum(['page_view', 'cta_click']),
  page_path: publicPath,
  target_path: publicPath.nullable().optional(),
  visitor_id: z.string().trim().min(16).max(160).regex(/^[a-zA-Z0-9_-]+$/, 'Identifiant visiteur invalide')
}).strict().superRefine((data, context) => {
  if (data.event_type === 'cta_click' && !data.target_path) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['target_path'], message: 'La cible du clic est obligatoire' });
  }
});

module.exports = { track };
