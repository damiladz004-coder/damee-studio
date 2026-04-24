import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
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
import type { ComicIssue, ContentItem, Profile, Purchase, Wallet } from "./src/lib/types";

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
  const [issues, setIssues] = useState<ComicIssue[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedTab, setSelectedTab] = useState<"library" | "wallet" | "issues">("library");
  const [message, setMessage] = useState("");
  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || "http://localhost:3000";

  useEffect(() => {
    loadContent();
    loadIssues();
    loadProfileAndWallet();
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

  async function loadIssues() {
    const { data } = await supabase
      .from("comic_issues")
      .select("*")
      .eq("status", "published")
      .order("issue_number", { ascending: true });

    if (data?.length) setIssues(data);
  }

  async function loadProfileAndWallet() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const profileResult = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (profileResult.data) setProfile(profileResult.data);

    const response = await fetch(`${siteUrl}/api/wallet`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) return;

    const payload = (await response.json()) as {
      wallet: Wallet | null;
      purchases: Purchase[];
    };

    setWallet(payload.wallet ?? null);
    setPurchases(payload.purchases ?? []);
  }

  async function authenticate(mode: "login" | "signup") {
    setLoading(true);
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setMessage(error ? error.message : "You are signed in.");
    setLoading(false);

    if (!error) {
      await loadProfileAndWallet();
      await loadIssues();
    }
  }

  function formatNaira(amount: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  async function purchaseIssue(issueId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setMessage("Sign in before unlocking an issue.");
      return;
    }

    setLoading(true);
    const response = await fetch(`${siteUrl}/api/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        issueId,
        redirectPath: "/dashboard",
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      authorizationUrl?: string;
    };

    if (!response.ok || !payload.authorizationUrl) {
      setMessage(payload.error ?? "Purchase failed.");
      setLoading(false);
      return;
    }

    if (payload.authorizationUrl.includes("/payments/verify?")) {
      const url = new URL(payload.authorizationUrl);
      const reference = url.searchParams.get("reference") ?? "";
      const verifyResponse = await fetch(`${siteUrl}/api/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ issueId, reference }),
      });

      const verifyPayload = (await verifyResponse.json()) as { error?: string };
      setMessage(
        verifyResponse.ok
          ? "Issue unlocked."
          : (verifyPayload.error ?? "Payment verification failed."),
      );
    } else {
      setMessage("External checkout initialized. Complete payment on the web callback flow.");
    }

    setLoading(false);
    await loadProfileAndWallet();
  }

  function ownsIssue(issueId: string) {
    return purchases.some((purchase) => purchase.comic_issue_id === issueId);
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

        <View style={styles.tabRow}>
          {[
            ["library", "Library"],
            ["issues", "Issues"],
            ["wallet", "Wallet"],
          ].map(([tab, label]) => (
            <Pressable
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab as "library" | "wallet" | "issues")}
            >
              <Text style={styles.tabLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

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

        {selectedTab === "library" && (
          <>
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
          </>
        )}

        {selectedTab === "issues" && (
          <>
            <Text style={styles.sectionTitle}>Comic issues</Text>
            {issues.map((issue) => (
              <View key={issue.id} style={styles.issueCard}>
                <View style={styles.issueHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kind}>Issue {issue.issue_number}</Text>
                    <Text style={styles.cardTitle}>{issue.title}</Text>
                    <Text style={styles.cardCopy}>{issue.summary || "Story issue release"}</Text>
                  </View>
                  <Text style={styles.priceLabel}>{formatNaira(issue.price_naira)}</Text>
                </View>
                <TouchableOpacity
                  style={ownsIssue(issue.id) ? styles.secondaryButton : styles.primaryButton}
                  onPress={() => purchaseIssue(issue.id)}
                >
                  <Text style={styles.buttonText}>
                    {ownsIssue(issue.id) ? "Unlocked" : "Unlock issue"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {selectedTab === "wallet" && (
          <>
            <Text style={styles.sectionTitle}>Wallet</Text>
            <View style={styles.issueCard}>
              <Text style={styles.kind}>Available</Text>
              <Text style={styles.cardTitle}>{formatNaira(wallet?.available_balance ?? 0)}</Text>
              <Text style={styles.cardCopy}>
                Locked: {formatNaira(wallet?.locked_balance ?? 0)}{"\n"}
                Lifetime: {formatNaira(wallet?.lifetime_earnings ?? 0)}
              </Text>
            </View>
            <View style={styles.issueCard}>
              <Text style={styles.kind}>Referral</Text>
              <Text style={styles.cardTitle}>{profile?.referral_code ?? "No code yet"}</Text>
              <Text style={styles.cardCopy}>
                Referrals: {profile?.referral_count ?? 0}
              </Text>
            </View>
            <View style={styles.issueCard}>
              <Text style={styles.kind}>Purchased issues</Text>
              <Text style={styles.cardTitle}>{purchases.length}</Text>
              <Text style={styles.cardCopy}>
                Keep unlocking issues so referral commissions stay eligible across future releases.
              </Text>
            </View>
          </>
        )}
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
  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  tabButton: {
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabButtonActive: {
    backgroundColor: "rgba(71,181,255,0.16)",
    borderColor: "#47b5ff",
  },
  tabLabel: {
    color: "#ffffff",
    fontWeight: "700",
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
  issueCard: {
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  issueHeader: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  priceLabel: {
    color: "#47b5ff",
    fontSize: 14,
    fontWeight: "900",
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
