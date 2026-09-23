const { z } = require('zod');
const { passwordSchema } = require('../../utils/passwordPolicy');

const password = passwordSchema;
const email = z.string().email().transform((value) => value.toLowerCase());
const profileName = z.string().trim().min(2).max(100);

module.exports = {
  register: z.object({
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    email,
    phone: z.string().max(30).optional(),
    password
  }).strict(),
  login: z.object({ email, password: z.string().min(1) }).strict(),
  refresh: z.object({ refreshToken: z.string().min(20) }).strict(),
  logout: z.object({ refreshToken: z.string().min(20).optional() }).strict(),
  forgotPassword: z.object({ email }).strict(),
  verifyResetCode: z.object({ email, code: z.string().regex(/^\d{6}$/, 'Le code doit contenir exactement 6 chiffres') }).strict(),
  resetPassword: z.object({
    email: email.optional(),
    code: z.string().regex(/^\d{6}$/, 'Le code doit contenir exactement 6 chiffres').optional(),
    // Keep legacy links usable until their short expiry, while all new emails
    // use the six-digit confirmation code.
    token: z.string().min(32).optional(),
    password
  }).strict().refine(
    (data) => Boolean(data.token) || Boolean(data.email && data.code),
    'Saisissez votre adresse e-mail et le code à 6 chiffres'
  ),
  changePassword: z.object({
    current_password: z.string().min(1).max(72).optional(),
    new_password: password
  }).strict(),
  // This deliberately exposes only the connected user's non-sensitive profile
  // fields. Roles, email, status and permissions remain managed by the
  // administration endpoints.
  updateProfile: z.object({
    first_name: profileName,
    last_name: profileName,
    job_title: z.string().trim().max(150).nullable().optional()
  }).strict()
};
