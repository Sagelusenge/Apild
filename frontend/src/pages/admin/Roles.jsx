import ResourcePage from '../portal/ResourcePage';

export default function Roles() {
  return <ResourcePage
    title="Rôles et permissions"
    description="Créez les rôles utilisés lors de l’ajout des acteurs, puis attribuez leurs autorisations."
    resource="roles"
    canDelete
    secondaryAction={{ to: '/admin/utilisateurs', label: 'Créer un acteur' }}
  />;
}
