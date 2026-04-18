import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { supabase } from "./src/lib/supabase";
import type { ContentItem } from "./src/lib/types";

const demoContent: ContentItem[] = [
  {
    id: "comic-eagles-watch",
    slug: "eagles-watch",
    kind: "comic",
    title: "Eagle's Watch",
    description: "Teen guardians uncover a hidden signal beneath Lagos.",
    thumbnail_url:
      "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "animation-blue-hour",
    slug: "blue-hour",
    kind: "animation",
    title: "Blue Hour",
    description: "A courier delivers memories across a neon coast.",
    thumbnail_url:
      "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "game-shadow-run",
    slug: "shadow-run",
    kind: "game",
    title: "Shadow Run",
    description: "A tactical runner prototype from the Damee universe.",
    thumbnail_url:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
  },
];

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<ContentItem[]>(demoContent);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    const [comics, animations, games] = await Promise.all([
      supabase.from("comics").select("*").neq("status", "draft"),
      supabase.from("animations").select("*").neq("status", "draft"),
      supabase.from("games").select("*").neq("status", "draft"),
    ]);

    const rows = [
      ...(comics.data ?? []).map((item) => ({ ...item, kind: "comic" as const })),
      ...(animations.data ?? []).map((item) => ({
        ...item,
        kind: "animation" as const,
      })),
      ...(games.data ?? []).map((item) => ({ ...item, kind: "game" as const })),
    ];

    if (rows.length) setContent(rows);
  }

  async function authenticate(mode: "login" | "signup") {
    setLoading(true);
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setMessage(error ? error.message : "You are signed in.");
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Damee Studio</Text>
        <Text style={styles.title}>Comics, animation, games.</Text>
        <Text style={styles.copy}>
          Browse the shared Supabase library, sign in, and follow every release
          from your phone.
        </Text>

        <View style={styles.authBox}>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#71717a"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#71717a"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => authenticate("login")}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => authenticate("signup")}>
              <Text style={styles.buttonText}>Signup</Text>
            </TouchableOpacity>
          </View>
          {loading && <ActivityIndicator color="#47b5ff" />}
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Library</Text>
        {content.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={{ uri: item.thumbnail_url }} style={styles.image} />
            <View style={styles.cardBody}>
              <Text style={styles.kind}>{item.kind}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCopy}>{item.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030303",
  },
  content: {
    padding: 20,
    paddingBottom: 42,
  },
  eyebrow: {
    color: "#47b5ff",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 46,
    marginTop: 12,
    textTransform: "uppercase",
  },
  copy: {
    color: "#a1a1aa",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  authBox: {
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 28,
    padding: 14,
  },
  input: {
    backgroundColor: "#080808",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#ffffff",
    marginBottom: 10,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1d9bf0",
    borderRadius: 8,
    flex: 1,
    padding: 14,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  message: {
    color: "#a1a1aa",
    marginTop: 10,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 34,
    textTransform: "uppercase",
  },
  card: {
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    overflow: "hidden",
  },
  image: {
    height: 260,
    width: "100%",
  },
  cardBody: {
    padding: 14,
  },
  kind: {
    color: "#47b5ff",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
    textTransform: "uppercase",
  },
  cardCopy: {
    color: "#a1a1aa",
    lineHeight: 22,
    marginTop: 8,
  },
});
