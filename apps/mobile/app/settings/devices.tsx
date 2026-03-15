import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiDelete, apiGet } from "../../src/auth/api";
import { loadAuthFlowState } from "../../src/auth/flowStore";

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
            style={[authStyles.secondaryButton, { marginTop: 10 }]}
            onPress={async () => {
              if (!token) {
                return;
              }
              await apiDelete(`/v1/devices/${device.device_id}`, token);
              await refresh();
            }}
          >
            <Text style={authStyles.secondaryText}>Revoke device</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={authStyles.primaryButton} onPress={() => router.push("/settings/add-device-scan")}>
        <Text style={authStyles.primaryText}>Add device</Text>
      </Pressable>
    </ScrollView>
  );
}

