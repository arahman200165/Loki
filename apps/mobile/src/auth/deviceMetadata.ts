import { Platform } from "react-native";

export const getAuthPlatform = (): "ios" | "android" =>
  Platform.OS === "ios" ? "ios" : "android";

export const getDeviceModelLabel = () => {
  const constants = Platform.constants as { Model?: unknown; model?: unknown } | undefined;
  const rawModel = constants?.Model ?? constants?.model;
  const model = typeof rawModel === "string" ? rawModel.trim() : "";

  if (model) {
    return model;
  }

  return Platform.OS === "ios" ? "iPhone" : "Android";
};

export const buildDeviceLabel = (suffix?: number) => {
  const model = getDeviceModelLabel();
  if (!suffix || suffix < 1) {
    return model;
  }

  return `${model}_${suffix}`;
};
