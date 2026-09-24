import ResourcePage from '../portal/ResourcePage';

export default function Roles() {
  return <ResourcePage
    title="Rôles et permissions"
    description="Trois rôles actifs : administration, communication et ressources humaines. Leurs autorisations restent configurables."
    resource="roles"
    canCreate={false}
    canDelete={false}
    secondaryAction={{ to: '/admin/utilisateurs', label: 'Créer un acteur' }}
  />;
}
