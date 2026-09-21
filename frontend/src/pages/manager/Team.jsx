import ResourcePage from '../portal/ResourcePage';

export default function Team() {
  return <ResourcePage
    title="Équipe"
    description="Chaque acteur créé rejoint automatiquement cette équipe. Ajoutez un acteur pour lui attribuer son accès et son rôle."
    resource="users"
    canCreate
  />;
}
