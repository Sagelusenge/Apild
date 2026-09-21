const { z } = require('zod');

const passwordSchema = z.string()
  .min(12, 'Le mot de passe doit contenir au moins 12 caracteres')
  .max(72, 'Le mot de passe ne peut pas depasser 72 caracteres')
  .regex(/[a-z]/, 'Le mot de passe doit contenir une minuscule')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule')
  .regex(/\d/, 'Le mot de passe doit contenir un chiffre')
  .regex(/[^A-Za-z0-9\s]/, 'Le mot de passe doit contenir un caractere special')
  .refine((value) => !/\s/.test(value), 'Le mot de passe ne peut pas contenir d espace');

module.exports = { passwordSchema };
