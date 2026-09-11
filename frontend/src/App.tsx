import { Route, Routes } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { AuthPage } from "./pages/AuthPage";
import { BrowsePage } from "./pages/BrowsePage";
import { MovieDetailPage } from "./pages/MovieDetailPage";
import { WishlistPage } from "./pages/WishlistPage";

export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/movie/:movieId" element={<MovieDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<BrowsePage />} />
      </Route>
    </Routes>
  );
}

export default App;
