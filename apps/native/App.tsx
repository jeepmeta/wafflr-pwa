import { getDeviceId } from "@wafflr/core";

/**
 * Expo shell placeholder.
 * Replace with expo-router screens when native work starts.
 * Shared room/mode logic lives in @wafflr/core — do not fork it here.
 */
export default function App() {
  const deviceId = typeof window !== "undefined" ? getDeviceId() : "native";
  return null;
}

// Silence unused in shell builds
void getDeviceId;
