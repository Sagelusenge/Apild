import ResourcePage from '../portal/ResourcePage';

export default function MyTasks() {
  return <ResourcePage title="Mes tâches" description="Travaux assignés, priorités et échéances." resource="tasks" canCreate={false}/>;
}
