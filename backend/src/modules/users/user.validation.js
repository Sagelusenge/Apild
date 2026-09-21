const { z } = require('zod');
const { passwordSchema } = require('../../utils/passwordPolicy');

const fields = {
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  email: z.string().email().transform((value) => value.toLowerCase()),
  phone: z.string().max(30).nullable().optional(),
  password: passwordSchema,
  avatar_url: z.string().max(500).nullable().optional(),
  job_title: z.string().max(150).nullable().optional(),
  status: z.enum(['pending', 'active', 'suspended', 'inactive']).optional(),
  role_ids: z.array(z.coerce.number().int().positive()).max(10).optional()
};

module.exports = {
  create: z.object(fields).pick({ first_name: true, last_name: true, email: true, phone: true, password: true, avatar_url: true, job_title: true, status: true, role_ids: true }).strict(),
  update: z.object(fields).partial().strict().refine((data) => Object.keys(data).length > 0, 'Aucune donnee a modifier')
};
