import { NavigationProvider, usePathname } from "@/lib/navigation";
import { HomeScreen } from "@/components/home-screen";
import { ProcessingScreen } from "@/components/processing-screen";
import { ResultScreen } from "@/components/result-screen";
import { ReviewScreen } from "@/components/review-screen";
import { HistoryScreen } from "@/components/history-screen";
import { SettingsScreen } from "@/components/settings-screen";

function AppContent() {
  const pathname = usePathname();

  if (pathname === "/processing") {
    return <ProcessingScreen />;
  }
  if (pathname === "/result") {
    return <ResultScreen />;
  }
  if (pathname === "/review") {
    return <ReviewScreen />;
  }
  if (pathname === "/history") {
    return <HistoryScreen />;
  }
  if (pathname === "/settings") {
    return <SettingsScreen />;
  }

  return <HomeScreen />;
}

export default function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}
