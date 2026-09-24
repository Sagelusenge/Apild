import ResourcePage from '../portal/ResourcePage';

export default function Interventions() {
  return <ResourcePage title="Interventions" description="Documentez les activités de terrain avec leurs bénéficiaires et une photo." resource="interventions" canDelete={false} />;
}
