import ResourcePage from '../portal/ResourcePage';

export default function Reports() {
  return <ResourcePage
    title="Rapports"
    description="Rapports de suivi et synthèses d’impact, prêts à imprimer."
    resource="reports"
    canDelete
    printable
  />;
}
