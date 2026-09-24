import ResourcePage from '../portal/ResourcePage';

export default function Reports() {
  return <ResourcePage
    title="Rapports"
    description="États de suivi et synthèses d’impact. Chaque rapport peut être téléchargé en PDF."
    resource="reports"
    canDelete
  />;
}
