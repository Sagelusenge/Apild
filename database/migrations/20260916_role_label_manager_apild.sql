-- Keep the single consolidated administrator role while using the title shown
-- in the APILD portal and actor management screens.
UPDATE roles
   SET name = 'Manager APILD',
       description = 'Pilotage global, administration et coordination opérationnelle de la plateforme APILD'
 WHERE code = 'admin';
