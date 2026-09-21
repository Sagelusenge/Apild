const { z } = require('zod');
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional();
const shape={reference:z.string().max(40).optional(),project_id:z.coerce.number().int().positive().nullable().optional(),parent_task_id:z.coerce.number().int().positive().nullable().optional(),title:z.string().min(2).max(200),description:z.string().nullable().optional(),status:z.enum(['todo','in_progress','blocked','review','completed','cancelled']).optional(),priority:z.enum(['low','medium','high','critical']).optional(),start_date:date,due_date:date,progress_percent:z.coerce.number().min(0).max(100).optional(),estimated_hours:z.coerce.number().min(0).nullable().optional(),actual_hours:z.coerce.number().min(0).nullable().optional()};
const create=z.object(shape).strict();
module.exports={create,update:create.partial().refine(v=>Object.keys(v).length>0,'Aucune donnee a modifier')};
