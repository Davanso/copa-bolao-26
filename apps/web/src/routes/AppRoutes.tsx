import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AppLayout } from "../components/AppLayout";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { GamesPage } from "../pages/GamesPage";
import { LivePage } from "../pages/LivePage";
import { GuessesPage } from "../pages/GuessesPage";
import { RankingPage } from "../pages/RankingPage";
import { GroupsPage } from "../pages/GroupsPage";
import { GroupDetailsPage } from "../pages/GroupDetailsPage";

const lastRouteStorageKey = "bolao.lastRoute";

export function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/guesses" element={<GuessesPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function HomeRoute() {
  const location = useLocation();
  const lastRoute = localStorage.getItem(lastRouteStorageKey);

  if (
    !location.state?.skipRouteRestore &&
    lastRoute &&
    lastRoute !== "/" &&
    lastRoute.startsWith("/")
  ) {
    return <Navigate to={lastRoute} replace />;
  }

  return <GamesPage />;
}
