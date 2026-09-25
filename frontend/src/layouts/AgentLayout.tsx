import AppShell from "./AppShell";
import { buildAgentShell } from "./shellConfigs";
import { useTranslation } from "../i18n";

export default function AgentLayout() {
  const { t } = useTranslation();
  return <AppShell config={buildAgentShell(t)} />;
}
