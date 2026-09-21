import AppShell from "./AppShell";
import { agentShell } from "./shellConfigs";

export default function AgentLayout() {
  return <AppShell config={agentShell} />;
}
