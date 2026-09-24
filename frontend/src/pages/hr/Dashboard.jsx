import { useEffect, useState } from 'react';
import { CalendarRange, FileUser, RefreshCw } from 'lucide-react';
import { api, unwrap } from '../../api/axios';
import StatCard from '../../components/dashboard/StatCard';
import Loader from '../../components/common/Loader';

export default function HrDashboard() {
  const [state, setState] = useState({ loading: true, employeeCount: 0, pending: 0, expiring: [], error: '' });
  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const overview = await unwrap(api.get('/hr/overview'));
      setState({ loading: false, employeeCount: overview.employeeCount, pending: overview.pendingLeaves, expiring: overview.expiringContracts || [], error: '' });
    } catch {
      setState({ loading: false, employeeCount: 0, pending: 0, expiring: [], error: 'Les données RH sont momentanément indisponibles.' });
    }
  };
  useEffect(() => { load(); }, []);
  return <div className="manager-dashboard">
    <div className="dashboard-welcome"><div><h1>Ressources humaines</h1><p>Suivi des dossiers du personnel, des contrats et des congés.</p></div><button className="sync-button" type="button" onClick={load}><RefreshCw size={17} /> Actualiser</button></div>
    {state.loading ? <Loader /> : state.error ? <p role="alert">{state.error}</p> : <>
      <div className="metric-grid"><StatCard label="Dossiers du personnel" value={state.employeeCount} icon={FileUser} /><StatCard label="Congés à traiter" value={state.pending} icon={CalendarRange} tone="blue" /><StatCard label="Contrats à échéance sous 60 jours" value={state.expiring.length} icon={FileUser} tone="gold" /></div>
      {state.expiring.length > 0 && <section className="dashboard-panel card"><div className="panel-heading"><h2>Échéances de contrat</h2></div><ul>{state.expiring.map((employee) => <li key={employee.reference}>{employee.first_name} {employee.last_name} — {employee.reference} — {String(employee.contract_end_date).slice(0, 10)}</li>)}</ul></section>}
    </>}
  </div>;
}
