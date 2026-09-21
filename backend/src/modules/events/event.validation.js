const { z } = require('zod');
const dateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/, 'Date et heure invalides');
const shape={project_id:z.coerce.number().int().positive().nullable().optional(),title:z.string().min(2).max(200),description:z.string().nullable().optional(),event_type:z.string().max(50).optional(),status:z.enum(['scheduled','ongoing','completed','cancelled']).optional(),starts_at:dateTime,ends_at:dateTime,reminder_minutes:z.coerce.number().int().min(0).max(43200).optional(),location:z.string().max(255).nullable().optional(),meeting_url:z.string().url().max(500).nullable().optional(),is_public:z.boolean().optional(),organizer_id:z.coerce.number().int().positive().nullable().optional()};
const create=z.object(shape).strict();
module.exports={create,update:create.partial().refine(v=>Object.keys(v).length>0,'Aucune donnee a modifier')};
