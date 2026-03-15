import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";
import { apiPut } from "../../src/auth/api";

export default function DisplayNameScreen() {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const proceed = async (skip = false) => {
    const value = skip ? "" : displayName.trim();
    if (value.length > 40) {
      setError("Display name must be 40 characters or less.");
      return;
    }

    const state = await loadAuthFlowState();
    await saveAuthFlowPatch({ displayName: value || null });
    if (state.authToken) {
      await apiPut(
        "/v1/profile",
        {
          display_name: value || null,
          encrypted_profile_blob: null,
        },
        state.authToken,
      );
    }
    router.push("/(auth)/private-id");
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Set a name for your profile</Text>
      <Text style={authStyles.subtitle}>This is optional. You can change it later.</Text>
      <Text style={authStyles.helper}>You can also stay anonymous and set this later.</Text>

      <TextInput
        style={authStyles.input}
        placeholder="Enter a display name"
        placeholderTextColor="#94a3b8"
        value={displayName}
        onChangeText={(text) => {
          setDisplayName(text);
          setError(null);
        }}
      />

      {error ? <Text style={authStyles.warning}>{error}</Text> : null}

      <Pressable style={authStyles.primaryButton} onPress={() => void proceed(false)}>
        <Text style={authStyles.primaryText}>Continue</Text>
      </Pressable>
      <Pressable style={authStyles.secondaryButton} onPress={() => void proceed(true)}>
        <Text style={authStyles.secondaryText}>Skip</Text>
      </Pressable>
    </ScrollView>
  );
}
