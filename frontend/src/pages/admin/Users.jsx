import ResourcePage from '../portal/ResourcePage';

export default function Users() {
  return <ResourcePage
    title="Acteurs"
    description="Comptes, rôles, statuts et accès à la plateforme."
    resource="users"
    canDelete
    canManageAccountStatus
  />;
}
