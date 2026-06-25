import { Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomeScreen from './components/home/HomeScreen';
import CategoryScreen from './components/home/CategoryScreen';
import ModuleExperience from './components/module/ModuleExperience';
import ContextIntro from './components/module/ContextIntro';
import StoryFeed from './components/module/StoryFeed';
import QuizStage from './components/module/QuizStage';
import FlashcardStage from './components/module/FlashcardStage';
import NotFound from './components/NotFound';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/c/:cat" element={<CategoryScreen />} />
        <Route path="/m/:cat/:sub/:mod" element={<ModuleExperience />}>
          <Route index element={<ContextIntro />} />
          <Route path="story" element={<StoryFeed />} />
          <Route path="quiz" element={<QuizStage />} />
          <Route path="flashcards" element={<FlashcardStage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
