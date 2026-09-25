import AppShell from "./AppShell";
import { buildAdminShell } from "./shellConfigs";
import { useTranslation } from "../i18n";

export default function AdminLayout() {
  const { t } = useTranslation();
  return <AppShell config={buildAdminShell(t)} />;
}
