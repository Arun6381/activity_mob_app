import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, AppState, StyleSheet, Text, View } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { Button } from "./components/ui";
import { API_URL } from "./config";
import { colors, fonts } from "./theme";

// "Offline" means the phone has no connection, or cannot reach your server
NetInfo.configure({
  reachabilityUrl: `${API_URL}/api/forms`,
  reachabilityTest: async () => true, // any reply from the server means we are online
  reachabilityLongTimeout: 30 * 1000,
  reachabilityShortTimeout: 5 * 1000,
  reachabilityRequestTimeout: 10 * 1000,
});

const isOnline = (s: NetInfoState) => s.isConnected !== false && s.isInternetReachable !== false;

export function useOnline() {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);

  const retry = useCallback(async () => {
    setChecking(true);
    try { setOnline(isOnline(await NetInfo.refresh())); } finally { setChecking(false); }
  }, []);

  useEffect(() => {
    NetInfo.fetch().then((s) => setOnline(isOnline(s)));
    const unsubscribe = NetInfo.addEventListener((s) => setOnline(isOnline(s))); // goes back to the app by itself
    const app = AppState.addEventListener("change", (state) => { if (state === "active") NetInfo.refresh().then((s) => setOnline(isOnline(s))); });
    return () => { unsubscribe(); app.remove(); };
  }, []);

  return { online, checking, retry };
}

export function NoInternetScreen({ checking, onRetry }: { checking: boolean; onRetry: () => void }) {
  return (
    <View style={s.root} accessibilityViewIsModal accessibilityRole="alert">
      <View style={s.badge}>
        <View style={s.dot} />
        <View style={s.arcBig} />
        <View style={s.arcSmall} />
        <View style={s.slash} />
      </View>
      <Text style={s.title}>No internet connection</Text>
      <Text style={s.text}>Check your Wi-Fi or mobile data. The app will continue automatically when you are back online.</Text>
      {checking ? <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} /> : <Button title="Try again" onPress={onRetry} style={{ marginTop: 24, alignSelf: "stretch" }} />}
    </View>
  );
}

const s = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, elevation: 100, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 32 },
  badge: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center", marginBottom: 28, overflow: "hidden" },
  dot: { position: "absolute", bottom: 34, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.brandDark },
  arcBig: { position: "absolute", top: 30, width: 70, height: 70, borderRadius: 35, borderWidth: 8, borderColor: colors.brandDark, borderBottomColor: "transparent", borderLeftColor: "transparent", borderRightColor: "transparent" },
  arcSmall: { position: "absolute", top: 46, width: 42, height: 42, borderRadius: 21, borderWidth: 8, borderColor: colors.brandDark, borderBottomColor: "transparent", borderLeftColor: "transparent", borderRightColor: "transparent" },
  slash: { position: "absolute", width: 8, height: 130, backgroundColor: colors.danger, borderRadius: 4, transform: [{ rotate: "45deg" }], borderWidth: 2, borderColor: colors.tint },
  title: { fontSize: 22, fontWeight: "800", color: colors.ink, textAlign: "center", fontFamily: fonts.family },
  text: { color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 21, maxWidth: 320, fontFamily: fonts.family },
});
