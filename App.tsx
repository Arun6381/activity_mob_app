// import React, { useCallback, useEffect, useState } from "react";
// import { BackHandler, View } from "react-native";
// import { StatusBar } from "expo-status-bar";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { getToken, setToken } from "./src/api";
// import HomeScreen from "./src/screens/HomeScreen";
// import FormScreen from "./src/screens/FormScreen";
// import LoginScreen from "./src/screens/LoginScreen";
// import AdminHomeScreen from "./src/screens/AdminHomeScreen";
// import RecordsScreen from "./src/screens/RecordsScreen";
// import TemplatesScreen from "./src/screens/TemplatesScreen";
// import TemplateEditScreen from "./src/screens/TemplateEditScreen";
// import ArchiveScreen from "./src/screens/ArchiveScreen";
// import { Loading } from "./src/components/ui";
// import { colors } from "./src/theme";
// import { Route } from "./src/types";

// export default function App() {
//   const [stack, setStack] = useState<Route[]>([{ name: "home" }]);
//   const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
//   const route = stack[stack.length - 1];

//   const push = (r: Route) => setStack((s) => [...s, r]);
//   const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
//   const reset = (...routes: Route[]) => setStack(routes);

//   useEffect(() => { getToken().then((t) => setIsAdmin(!!t)); }, []);

//   // Android back button goes to the previous screen, and exits the app from the home screen
//   useEffect(() => {
//     const sub = BackHandler.addEventListener("hardwareBackPress", () => {
//       if (stack.length > 1) { pop(); return true; }
//       return false;
//     });
//     return () => sub.remove();
//   }, [stack.length, pop]);

//   const signOut = useCallback(async () => { await setToken(null); setIsAdmin(false); setStack([{ name: "home" }]); }, []);
//   // Login expired or rejected: clear it and ask the admin to sign in again
//   const unauthorized = useCallback(async () => { await setToken(null); setIsAdmin(false); setStack([{ name: "home" }, { name: "login" }]); }, []);

//   if (isAdmin === null) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><Loading /></View>;

//   return (
//     <SafeAreaProvider>
//       <StatusBar style="light" />
//       {route.name === "home" && (
//         <HomeScreen onOpenForm={(slug) => push({ name: "form", slug })} onAdmin={() => push({ name: isAdmin ? "admin" : "login" })} />
//       )}
//       {route.name === "form" && <FormScreen key={route.slug} slug={route.slug} onBack={pop} />}
//       {route.name === "login" && (
//         <LoginScreen onBack={pop} onSuccess={() => { setIsAdmin(true); reset({ name: "home" }, { name: "admin" }); }} />
//       )}
//       {route.name === "admin" && <AdminHomeScreen onBack={pop} onSignOut={signOut} onOpen={(key) => push({ name: key })} />}
//       {route.name === "records" && <RecordsScreen onBack={pop} onUnauthorized={unauthorized} />}
//       {route.name === "templates" && (
//         <TemplatesScreen onBack={pop} onUnauthorized={unauthorized} onOpen={(id) => push({ name: "templateEdit", id })} />
//       )}
//       {route.name === "templateEdit" && (
//         <TemplateEditScreen key={route.id ?? "new"} id={route.id} onBack={pop} onSaved={pop} onUnauthorized={unauthorized} />
//       )}
//       {route.name === "archive" && <ArchiveScreen onBack={pop} onUnauthorized={unauthorized} />}
//     </SafeAreaProvider>
//   );
// }

import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getToken, setToken } from "./src/api";
import HomeScreen from "./src/screens/HomeScreen";
import FormScreen from "./src/screens/FormScreen";
import LoginScreen from "./src/screens/LoginScreen";
import AdminHomeScreen from "./src/screens/AdminHomeScreen";
import RecordsScreen from "./src/screens/RecordsScreen";
import TemplatesScreen from "./src/screens/TemplatesScreen";
import TemplateEditScreen from "./src/screens/TemplateEditScreen";
import ArchiveScreen from "./src/screens/ArchiveScreen";
import { Loading } from "./src/components/ui";
import { colors } from "./src/theme";
import { Route } from "./src/types";
import { NoInternetScreen, useOnline } from "./src/NoInternet";

export default function App() {
  const [stack, setStack] = useState<Route[]>([{ name: "home" }]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const route = stack[stack.length - 1];
  const { online, checking, retry } = useOnline();

  const push = (r: Route) => setStack((s) => [...s, r]);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const reset = (...routes: Route[]) => setStack(routes);

  useEffect(() => { getToken().then((t) => setIsAdmin(!!t)); }, []);

  // Android back button goes to the previous screen, and exits the app from the home screen
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!online) return false; // on the no-internet screen, Back leaves the app
      if (stack.length > 1) { pop(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, pop, online]);

  const signOut = useCallback(async () => { await setToken(null); setIsAdmin(false); setStack([{ name: "home" }]); }, []);
  // Login expired or rejected: clear it and ask the admin to sign in again
  const unauthorized = useCallback(async () => { await setToken(null); setIsAdmin(false); setStack([{ name: "home" }, { name: "login" }]); }, []);

  if (isAdmin === null) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><Loading /></View>;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {route.name === "home" && (
        <HomeScreen onOpenForm={(slug) => push({ name: "form", slug })} onAdmin={() => push({ name: isAdmin ? "admin" : "login" })} />
      )}
      {route.name === "form" && <FormScreen key={route.slug} slug={route.slug} onBack={pop} />}
      {route.name === "login" && (
        <LoginScreen onBack={pop} onSuccess={() => { setIsAdmin(true); reset({ name: "home" }, { name: "admin" }); }} />
      )}
      {route.name === "admin" && <AdminHomeScreen onBack={pop} onSignOut={signOut} onOpen={(key) => push({ name: key })} />}
      {route.name === "records" && <RecordsScreen onBack={pop} onUnauthorized={unauthorized} />}
      {route.name === "templates" && (
        <TemplatesScreen onBack={pop} onUnauthorized={unauthorized} onOpen={(id) => push({ name: "templateEdit", id })} />
      )}
      {route.name === "templateEdit" && (
        <TemplateEditScreen key={route.id ?? "new"} id={route.id} onBack={pop} onSaved={pop} onUnauthorized={unauthorized} />
      )}
      {route.name === "archive" && <ArchiveScreen onBack={pop} onUnauthorized={unauthorized} />}
      {/* Shown on top while offline, so a half-filled form is still there when the connection returns */}
      {!online && <NoInternetScreen checking={checking} onRetry={retry} />}
    </SafeAreaProvider>
  );
}