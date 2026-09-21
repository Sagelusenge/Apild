import ResourcePage from '../portal/ResourcePage';

export default function Subscribers() {
  return <ResourcePage title="Abonnés" description="Liste des destinataires de la lettre d’information." resource="newsletter/subscribers" canCreate={false}/>;
}
