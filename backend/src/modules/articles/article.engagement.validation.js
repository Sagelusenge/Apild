const { z } = require('zod');

const visitorId = z.string().uuid('Identifiant visiteur invalide');

module.exports = {
  comment: z.object({
    author_name: z.string().trim().min(2).max(120),
    author_email: z.string().trim().email().max(190).optional(),
    content: z.string().trim().min(2).max(2000)
  }).strict(),
  reaction: z.object({ visitor_id: visitorId }).strict(),
  share: z.object({}).strict()
};
