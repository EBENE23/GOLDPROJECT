import AppShell from "./AppShell";
import { adminShell } from "./shellConfigs";

export default function AdminLayout() {
  return <AppShell config={adminShell} />;
}
