const { z } = require('zod');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional();
const shape = {
  reference: z.string().max(40).optional(), name: z.string().min(2).max(200), description: z.string().nullable().optional(), objectives: z.string().nullable().optional(),
  status: z.enum(['draft','planned','active','on_hold','completed','cancelled']).optional(), priority: z.enum(['low','medium','high','critical']).optional(),
  start_date: date, end_date: date, budget: z.coerce.number().min(0).optional(), currency: z.string().length(3).optional(), country: z.string().max(100).optional(),
  province: z.string().max(100).nullable().optional(), territory: z.string().max(100).nullable().optional(), locality: z.string().max(150).nullable().optional(),
  progress_percent: z.coerce.number().min(0).max(100).optional(), manager_id: z.coerce.number().int().positive().nullable().optional()
};
const create=z.object(shape).strict();
module.exports={create,update:create.partial().refine(v=>Object.keys(v).length>0,'Aucune donnee a modifier')};
