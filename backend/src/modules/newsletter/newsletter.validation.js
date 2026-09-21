const { z } = require('zod');
const shape={subject:z.string().min(2).max(250),preview_text:z.string().max(255).nullable().optional(),content:z.string().min(1),status:z.enum(['draft','scheduled','sending','sent','cancelled']).optional(),scheduled_at:z.string().nullable().optional(),sent_at:z.string().nullable().optional()};
const create=z.object(shape).strict();
module.exports={create,update:create.partial().refine(v=>Object.keys(v).length>0,'Aucune donnee a modifier')};
