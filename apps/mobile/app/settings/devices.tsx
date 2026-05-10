import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiDelete, apiGet } from "../../src/auth/api";
import { loadAuthFlowState } from "../../src/auth/flowStore";
import { wipeAllLocalAuthData } from "../../src/auth/localWipe";

type DeviceItem = {
  device_id: string;
  device_label: string;
  platform: string;
  status: string;
  last_active_coarse: string;
};

type DevicesResponse = { devices: DeviceItem[] };

export default function DevicesScreen() {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);

  const refresh = async () => {
    const state = await loadAuthFlowState();
    setToken(state.authToken);
    if (!state.authToken) {
      return;
    }
    const response = await apiGet<DevicesResponse>("/v1/devices", state.authToken);
    setDevices(response.devices ?? []);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Devices</Text>
      <Text style={authStyles.subtitle}>Manage the devices that can access your account.</Text>
      <Text style={authStyles.cardTitle}>Trusted devices</Text>

      {devices.length === 0 ? (
        <Text style={authStyles.helper}>No trusted devices found.</Text>
      ) : null}

      {devices.map((device) => (
        <View key={device.device_id} style={authStyles.card}>
          <Text style={authStyles.cardTitle}>{device.device_label}</Text>
          <Text style={authStyles.cardText}>
            {device.platform} - {device.last_active_coarse} - {device.status}
          </Text>
          <Pressable
            style={[
              authStyles.secondaryButton,
              { marginTop: 10 },
              revokingDeviceId === device.device_id ? { opacity: 0.7 } : null,
            ]}
            disabled={revokingDeviceId === device.device_id}
            onPress={() => {
              const isOnlyTrustedDevice = devices.length === 1;
              const warningMessage = isOnlyTrustedDevice
                ? "This is your only trusted device. Revoking it will wipe local app data on this phone and return you to the welcome screen. Continue?"
                : "Revoking this device will remove its access to your account. Continue?";

              Alert.alert("Revoke device?", warningMessage, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Revoke",
                  style: "destructive",
                  onPress: () => {
                    void (async () => {
                      if (!token) {
                        return;
                      }
                      setRevokingDeviceId(device.device_id);
                      try {
                        await apiDelete(`/v1/devices/${device.device_id}`, token);
                        if (isOnlyTrustedDevice) {
                          await wipeAllLocalAuthData();
                          router.replace({
                            pathname: "/(auth)/welcome",
                            params: { notice: "session-reset" },
                          });
                          return;
                        }
                        await refresh();
                      } catch (caught) {
                        Alert.alert(
                          "Couldn't revoke device",
                          caught instanceof Error
                            ? caught.message
                            : "Please try again.",
                        );
                      } finally {
                        setRevokingDeviceId(null);
                      }
                    })();
                  },
                },
              ]);
            }}
          >
            <Text style={authStyles.secondaryText}>
              {revokingDeviceId === device.device_id ? "Revoking..." : "Revoke device"}
            </Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={authStyles.primaryButton} onPress={() => router.push("/settings/add-device-scan")}>
        <Text style={authStyles.primaryText}>Add device</Text>
      </Pressable>
    </ScrollView>
  );
}
