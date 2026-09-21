const service = require('./report.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').reports;
const asyncHandler=require('../../utils/asyncHandler');
const pdfService=require('../../services/pdf.service');

const controller=createController(service,config);
controller.pdf=asyncHandler(async(req,res)=>{
 const report=await service.get(req.params.id);
 const buffer=await pdfService.createReportPdf(report);
 res.setHeader('Content-Type','application/pdf');
 res.setHeader('Content-Disposition',`attachment; filename="${report.reference}.pdf"`);
 res.send(buffer);
});
module.exports=controller;
