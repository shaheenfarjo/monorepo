import { Toolbar as BaseHubToolbar } from "basehub/next-toolbar";
import { keys } from "../keys";

/** BaseHub's draft-mode toolbar; renders nothing until BASEHUB_TOKEN is set. */
export const Toolbar = () => (keys().BASEHUB_TOKEN ? <BaseHubToolbar /> : null);
