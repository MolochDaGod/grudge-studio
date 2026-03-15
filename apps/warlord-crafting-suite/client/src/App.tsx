import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MinerPage from "@/pages/Miner";
import ForesterPage from "@/pages/Forester";
import MysticPage from "@/pages/Mystic";
import ChefPage from "@/pages/Chef";
import EngineerPage from "@/pages/Engineer";
import ArsenalPage from "@/pages/Arsenal";
import RecipesInventory from "@/pages/RecipesInventory";
import AdminPage from "@/pages/Admin";
import ShopPage from "@/pages/Shop";
import LoginPage from "@/pages/Login";
import SpriteGenerator from "@/pages/SpriteGenerator";
import SpriteGallery from "@/pages/SpriteGallery";
import CommandCenter from "@/pages/CommandCenter";
import NPCChat from "@/pages/NPCChat";
import AdminMap from "@/pages/AdminMap";
import CraftingPage from "@/pages/Crafting";
import HomeIslandPage from "@/pages/HomeIsland";
import AIAgentTesting from "@/pages/AIAgentTesting";
import IslandDemo from "@/pages/IslandDemo";
import SkillTreePage from "@/pages/SkillTreePage";
import CharacterPage from "@/pages/CharacterPage";
import CollaborationHub from "@/pages/CollaborationHub";
import { Layout } from "@/components/layout/Layout";
import { CharacterProvider } from "@/contexts/CharacterContext";
import { PlatformProvider } from "@/contexts/PlatformContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SkillTreeProvider } from "@/contexts/SkillTreeContext";
import { AdminRoute, PremiumRoute, AuthGate } from "@/components/ProtectedRoute";
import { CollectionTray } from "@/components/profession/CollectionTray";
import { ProfessionNodePanel } from "@/components/profession/ProfessionNodePanel";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <AuthGate>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/miner" component={MinerPage} />
            <Route path="/forester" component={ForesterPage} />
            <Route path="/mystic" component={MysticPage} />
            <Route path="/chef" component={ChefPage} />
            <Route path="/engineer" component={EngineerPage} />
            <Route path="/arsenal" component={ArsenalPage} />
            <Route path="/recipes" component={RecipesInventory} />
            <Route path="/shop" component={ShopPage} />
            <Route path="/admin">
              <AdminRoute><AdminPage /></AdminRoute>
            </Route>
            <Route path="/sprites">
              <AdminRoute><SpriteGenerator /></AdminRoute>
            </Route>
            <Route path="/gallery">
              <PremiumRoute><SpriteGallery /></PremiumRoute>
            </Route>
            <Route path="/command">
              <PremiumRoute><CommandCenter /></PremiumRoute>
            </Route>
            <Route path="/npcs" component={NPCChat} />
            <Route path="/crafting" component={CraftingPage} />
            <Route path="/adminmap">
              <AdminRoute><AdminMap /></AdminRoute>
            </Route>
            <Route path="/skill-tree" component={SkillTreePage} />
            <Route path="/character" component={CharacterPage} />
            <Route path="/home-island" component={HomeIslandPage} />
            <Route path="/island-demo" component={IslandDemo} />
            <Route path="/collaboration-hub" component={CollaborationHub} />
            <Route path="/ai-testing">
              <AdminRoute><AIAgentTesting /></AdminRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Layout>
        </AuthGate>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlatformProvider>
          <CharacterProvider>
            <SkillTreeProvider>
              <TooltipProvider delayDuration={0}>
                <Toaster />
                <Router />
                <CollectionTray />
                <ProfessionNodePanel />
              </TooltipProvider>
            </SkillTreeProvider>
          </CharacterProvider>
        </PlatformProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
