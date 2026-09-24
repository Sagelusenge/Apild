import ResourcePage from './ResourcePage';

export default function MyCalendar() {
  return <ResourcePage title="Mon calendrier" description="Réunions et activités auxquelles vous participez." resource="events" canCreate={false} canEdit={false} />;
}
