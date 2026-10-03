// Selects the active ClimateApi implementation.
// VITE_USE_MOCK=true swaps in the browser-side mock controller; anything else
// talks to the real ESP8266. Components only ever import this file.

import { climateApi } from "./climateApi";
import type { ClimateApi } from "./climateApi";

const useMock = import.meta.env.VITE_USE_MOCK === "true";
// const useMock = import.meta.env.VITE_USE_MOCK === "false";

export const api: ClimateApi = useMock
  ? (await import("./mockController")).mockController
  : climateApi;

export { climateApi, ControllerRequestError } from "./climateApi";
export { mockControls } from "./mockController";
