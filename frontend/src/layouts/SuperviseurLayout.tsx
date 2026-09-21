import AppShell from "./AppShell";
import { superviseurShell } from "./shellConfigs";

export default function SuperviseurLayout() {
  return <AppShell config={superviseurShell} />;
}
