import { clearAllAuthFlowState } from "./flowStore";
import { clearAllLocalPasswordMaterial } from "./localLock";

export const wipeAllLocalAuthData = async () => {
  await clearAllAuthFlowState();
  await clearAllLocalPasswordMaterial();
};
