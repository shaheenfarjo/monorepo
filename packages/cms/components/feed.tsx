import { Pump } from "basehub/react-pump";
import { keys } from "../keys";

const renderNothing = () => null;

/** BaseHub's Pump; renders nothing until BASEHUB_TOKEN is set. */
export const Feed = (
  keys().BASEHUB_TOKEN ? Pump : renderNothing
) as typeof Pump;
