import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type UserAvatarProps = {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  size?: number;
};

export default function UserAvatar({
  avatarUrl,
  firstName,
  lastName,
  email,
  size = 40,
}: UserAvatarProps) {
  const hasAvatar = Boolean(avatarUrl && avatarUrl.trim().length > 0);

  if (hasAvatar) {
    return <Image source={{ uri: avatarUrl?.trim() }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="person" size={size * 0.5} color="#94a3b8" />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "#e2e8f0",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
});