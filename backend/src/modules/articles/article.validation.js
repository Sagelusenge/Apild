const { z } = require('zod');
const shape={reference:z.string().max(40).optional(),category_id:z.coerce.number().int().positive().nullable().optional(),author_id:z.coerce.number().int().positive().nullable().optional(),title:z.string().min(2).max(250),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(280).optional(),excerpt:z.string().nullable().optional(),content:z.string().min(1),featured_image_url:z.string().max(500).nullable().optional(),status:z.enum(['draft','review','published','archived']).optional(),is_featured:z.boolean().optional(),published_at:z.string().nullable().optional()};
const create=z.object(shape).strict();
module.exports={create,update:create.partial().refine(v=>Object.keys(v).length>0,'Aucune donnee a modifier')};
