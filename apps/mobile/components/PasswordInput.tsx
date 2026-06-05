import { useState } from "react";
import {
  TextInput,
  Pressable,
  View,
  Text,
  StyleSheet,
  TextInputProps,
} from "react-native";

interface PasswordInputProps extends Omit<TextInputProps, "secureTextEntry" | "style"> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function PasswordInput({
  value,
  onChangeText,
  placeholder = "Password",
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        {...rest}
      />
      <Pressable
        style={styles.toggle}
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        accessibilityLabel={visible ? "Hide password" : "Show password"}
      >
        <Text style={styles.toggleText}>{visible ? "Hide" : "Show"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  toggleText: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "600",
  },
});
