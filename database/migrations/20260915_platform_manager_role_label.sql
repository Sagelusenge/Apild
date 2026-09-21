-- Libellé métier unique après la fusion des anciens rôles admin et manager.
UPDATE roles
   SET name = 'Responsable de plateforme',
       description = 'Pilotage global, administration et coordination opérationnelle de la plateforme'
 WHERE code = 'admin';
