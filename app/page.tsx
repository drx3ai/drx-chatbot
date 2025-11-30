import AppShell from '../components/AppShell';
import { UIProvider } from '../lib/store';

/**
 * This is the default page of the application.  It wraps the chat UI in
 * a UIProvider which supplies global state (model selection and feature
 * toggles) to all child components.  AppShell holds the header,
 * sidebar and main chat area.
 */
export default function Page() {
  return (
    <UIProvider>
      <AppShell />
    </UIProvider>
  );
}