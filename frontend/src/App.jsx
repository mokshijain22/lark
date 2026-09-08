import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './shared/context/AuthContext';
import IconRail from './shared/components/IconRail';
import LoginPage from './pages/LoginPage';
import ContactsPage from './modules/contacts/ContactsPage';
import ApprovalsPage from './modules/approvals/ApprovalsPage';
import CalendarPage from './modules/calendar/CalendarPage';
import TasksPage from './modules/tasks/TasksPage';
import DocsPage from './modules/docs/DocsPage';
import BasePage from './modules/base/BasePage';
import SheetsPage from './modules/sheets/SheetsPage';
import SlidesPage from './modules/slides/SlidesPage';
import OkrPage from './modules/okr/OkrPage';
import AttendancePage from './modules/attendance/AttendancePage';
import MailPage from './modules/mail/MailPage';
import MinutesPage from './modules/minutes/MinutesPage';
import MagicSharePage from './modules/magicshare/MagicSharePage';
import AnycrossPage from './modules/anycross/AnycrossPage';
import WorkplacePage from './modules/workplace/WorkplacePage';
import IntegrationsPage from './modules/integrations/IntegrationsPage';
import TrelloCallbackPage from './modules/integrations/TrelloCallbackPage';
import GmailPage from './modules/integrations/GmailPage';
import TranslationPage from './modules/translation/TranslationPage';

function Workspace() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <IconRail />
      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        <Routes>
          <Route path="/workplace" element={<WorkplacePage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/base" element={<BasePage />} />
          <Route path="/sheets" element={<SheetsPage />} />
          <Route path="/slides" element={<SlidesPage />} />
          <Route path="/okr" element={<OkrPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/mail" element={<MailPage />} />
          <Route path="/minutes" element={<MinutesPage />} />
          <Route path="/share" element={<MagicSharePage />} />
          <Route path="/anycross" element={<AnycrossPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/integrations/trello/callback" element={<TrelloCallbackPage />} />
          <Route path="/integrations/gmail" element={<GmailPage />} />
          <Route path="/translation" element={<TranslationPage />} />
          <Route path="*" element={<Navigate to="/workplace" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return <Workspace />;
}
