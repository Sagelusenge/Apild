import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import ProtectedRoute from './ProtectedRoute';
import PermissionRoute from './PermissionRoute';
import ScrollToTop from '../components/common/ScrollToTop';
import AdminLayout from '../layouts/AdminLayout';
import CommunicationLayout from '../layouts/CommunicationLayout';
import useAuth from '../hooks/useAuth';
import { homeForUser } from '../utils/permissions';
import { emailFeaturesEnabled } from '../config/features';
import Home from '../pages/public/Home'; import About from '../pages/public/About'; import Projects from '../pages/public/Projects'; import ProjectDetails from '../pages/public/ProjectDetails'; import Interventions from '../pages/public/Interventions'; import News from '../pages/public/News'; import ArticleDetails from '../pages/public/ArticleDetails'; import Contact from '../pages/public/Contact'; import Unsubscribe from '../pages/public/Unsubscribe';
import Login from '../pages/auth/Login'; import ForgotPassword from '../pages/auth/ForgotPassword'; import ResetPassword from '../pages/auth/ResetPassword'; import ForcePasswordChange from '../pages/auth/ForcePasswordChange';
import ManagerDashboard from '../pages/manager/Dashboard'; import ManagerProjects from '../pages/manager/Projects'; import ManagerInterventions from '../pages/manager/Interventions'; import ManagerTasks from '../pages/manager/Tasks'; import ManagerCalendar from '../pages/manager/Calendar'; import ManagerReports from '../pages/manager/Reports';
import AdminUsers from '../pages/admin/Users'; import AdminRoles from '../pages/admin/Roles'; import AdminAudit from '../pages/admin/AuditLogs';
import CommunicationDashboard from '../pages/communication/Dashboard'; import CommunicationInterventions from '../pages/communication/Interventions'; import CommunicationArticles from '../pages/communication/Articles'; import CommunicationMedia from '../pages/communication/Media'; import CommunicationNewsletter from '../pages/communication/Newsletter'; import CommunicationSubscribers from '../pages/communication/Subscribers';
import StaffDocuments from '../pages/staff/Documents';
import MyCalendar from '../pages/portal/MyCalendar';
import HrLayout from '../layouts/HrLayout'; import HrDashboard from '../pages/hr/Dashboard'; import HrEmployees from '../pages/hr/Employees'; import HrLeaves from '../pages/hr/Leaves'; import HrContracts from '../pages/hr/Contracts';

function PortalRedirect(){const {user}=useAuth();return <Navigate to={homeForUser(user)} replace/>;}
function NotFound(){return <main className="not-found"><div><span className="eyebrow">Erreur 404</span><h1>Cette page n'existe pas</h1><a className="button button--primary" href="/">Retour a l'accueil</a></div></main>;}

export default function AppRoutes(){return <><ScrollToTop/><Routes>
  <Route element={<PublicLayout/>}><Route path="/" element={<Home/>}/><Route path="/a-propos" element={<About/>}/><Route path="/projets" element={<Projects/>}/><Route path="/projets/:id" element={<ProjectDetails/>}/><Route path="/interventions" element={<Interventions/>}/><Route path="/actualites" element={<News/>}/><Route path="/actualites/:id" element={<ArticleDetails/>}/><Route path="/contact" element={<Contact/>}/>{emailFeaturesEnabled && <Route path="/desabonnement" element={<Unsubscribe/>}/>}</Route>
  <Route path="/connexion" element={<Login/>}/><Route path="/mot-de-passe-oublie" element={emailFeaturesEnabled ? <ForgotPassword/> : <Navigate to="/connexion" replace/>}/><Route path="/reinitialiser-mot-de-passe" element={emailFeaturesEnabled ? <ResetPassword/> : <Navigate to="/connexion" replace/>}/>
  <Route element={<ProtectedRoute/>}><Route path="/portail" element={<PortalRedirect/>}/>
    <Route path="/premiere-connexion" element={<ForcePasswordChange/>}/>
    <Route path="/manager/*" element={<Navigate to="/admin" replace/>}/>
    <Route element={<PermissionRoute roles={['admin']}/>}><Route path="/admin" element={<AdminLayout/>}><Route index element={<ManagerDashboard/>}/><Route path="projets" element={<ManagerProjects/>}/><Route path="interventions" element={<ManagerInterventions/>}/><Route path="taches" element={<ManagerTasks/>}/><Route path="calendrier" element={<ManagerCalendar/>}/><Route path="equipe" element={<Navigate to="/admin/utilisateurs" replace/>}/><Route path="rapports" element={<ManagerReports/>}/><Route path="documents" element={<StaffDocuments/>}/><Route path="utilisateurs" element={<AdminUsers/>}/><Route path="roles" element={<AdminRoles/>}/><Route path="audit" element={<AdminAudit/>}/></Route></Route>
    <Route element={<PermissionRoute roles={['communication','admin']}/>}><Route path="/communication" element={<CommunicationLayout/>}><Route index element={<CommunicationDashboard/>}/><Route path="interventions" element={<CommunicationInterventions/>}/><Route path="calendrier" element={<MyCalendar/>}/><Route path="articles" element={<CommunicationArticles/>}/><Route path="medias" element={<CommunicationMedia/>}/><Route path="documents" element={<StaffDocuments/>}/><Route path="newsletters" element={emailFeaturesEnabled ? <CommunicationNewsletter/> : <Navigate to="/communication" replace/>}/><Route path="abonnes" element={emailFeaturesEnabled ? <CommunicationSubscribers/> : <Navigate to="/communication" replace/>}/><Route path="statistiques" element={<Navigate to="/communication" replace/>}/></Route></Route>
    <Route element={<PermissionRoute roles={['rh','admin']}/>}><Route path="/rh" element={<HrLayout/>}><Route index element={<HrDashboard/>}/><Route path="personnel" element={<HrEmployees/>}/><Route path="contrats" element={<HrContracts/>}/><Route path="conges" element={<HrLeaves/>}/><Route path="calendrier" element={<MyCalendar/>}/><Route path="documents" element={<StaffDocuments/>}/></Route></Route>
    <Route path="/staff/*" element={<Navigate to="/portail" replace/>}/>
  </Route><Route path="*" element={<NotFound/>}/>
</Routes></>;}
