import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AppLayout } from "../components/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { GamesPage } from "../pages/GamesPage";
import { LivePage } from "../pages/LivePage";
import { GuessesPage } from "../pages/GuessesPage";
import { RankingPage } from "../pages/RankingPage";
import { GroupsPage } from "../pages/GroupsPage";

export function AppRoutes() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<GamesPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/guesses" element={<GuessesPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
