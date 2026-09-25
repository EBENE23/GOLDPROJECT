import AppShell from "./AppShell";
import { buildSuperviseurShell } from "./shellConfigs";
import { useTranslation } from "../i18n";

export default function SuperviseurLayout() {
  const { t } = useTranslation();
  return <AppShell config={buildSuperviseurShell(t)} />;
}
