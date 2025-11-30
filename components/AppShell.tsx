import HeaderBar from './HeaderBar';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

/**
 * AppShell lays out the persistent UI elements of the chat interface.  It
 * contains the header bar at the top, a sidebar for navigating between
 * conversations, and the main chat window.  The shell defines the overall
 * grid structure used throughout the app.
 */
export default function AppShell() {
  return (
    <div className="app-shell" data-theme="dark">
      <HeaderBar />
      <div className="layout">
        {/* In RTL layouts the sidebar is rendered on the right by reversing the grid order */}
        <ChatWindow />
        <Sidebar />
      </div>
    </div>
  );
}
