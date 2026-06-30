import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomeScreen from './components/home/HomeScreen';
import CategoryScreen from './components/home/CategoryScreen';
import ModuleExperience from './components/module/ModuleExperience';
import ContextIntro from './components/module/ContextIntro';
import BookStage from './components/module/BookStage';
import StoryFeed from './components/module/StoryFeed';
import QuizStage from './components/module/QuizStage';
import FlashcardStage from './components/module/FlashcardStage';
import NotFound from './components/NotFound';

// The Geography Challenge pulls in the country topology + d3-geo, so it is
// code-split: the data only loads when a learner actually opens a map.
const GeographyHome = lazy(() => import('./components/geo/GeographyHome'));
const GeographyGame = lazy(() => import('./components/geo/GeographyGame'));

// The Languages domain (Spanish) ships its own content + SRS engine, so it is
// code-split too — only loaded when a learner opens it.
const SpanishHome = lazy(() => import('./components/language/SpanishHome'));
const PathScreen = lazy(() => import('./components/language/PathScreen'));
const LessonExperience = lazy(() => import('./components/language/LessonExperience'));
const ReviewModePicker = lazy(() => import('./components/language/ReviewModePicker'));
const ReviewDashboard = lazy(() => import('./components/language/ReviewDashboard'));
const WordMatchingReview = lazy(() => import('./components/language/WordMatchingReview'));
const ReviewSession = lazy(() => import('./components/language/ReviewSession'));

function GeoFallback() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-faint">Loading map…</div>
  );
}

function LangFallback() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-faint">Loading…</div>
  );
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/c/:cat" element={<CategoryScreen />} />
        <Route path="/c/:cat/:sub" element={<CategoryScreen />} />
        <Route
          path="/geo"
          element={
            <Suspense fallback={<GeoFallback />}>
              <GeographyHome />
            </Suspense>
          }
        />
        <Route
          path="/geo/:board"
          element={
            <Suspense fallback={<GeoFallback />}>
              <GeographyGame />
            </Suspense>
          }
        />
        <Route
          path="/learn/spanish"
          element={
            <Suspense fallback={<LangFallback />}>
              <SpanishHome />
            </Suspense>
          }
        />
        <Route
          path="/learn/spanish/path"
          element={
            <Suspense fallback={<LangFallback />}>
              <PathScreen />
            </Suspense>
          }
        />
        <Route
          path="/learn/spanish/lesson/:scenario"
          element={
            <Suspense fallback={<LangFallback />}>
              <LessonExperience />
            </Suspense>
          }
        />
        <Route
          path="/learn/spanish/review"
          element={
            <Suspense fallback={<LangFallback />}>
              <ReviewModePicker />
            </Suspense>
          }
        />
        <Route
          path="/learn/spanish/review/classic"
          element={
            <Suspense fallback={<LangFallback />}>
              <ReviewDashboard />
            </Suspense>
          }
        />
        <Route
          path="/learn/spanish/review/matching"
          element={
            <Suspense fallback={<LangFallback />}>
              <WordMatchingReview />
            </Suspense>
          }
        />
        <Route
          path="/learn/spanish/review/:mode"
          element={
            <Suspense fallback={<LangFallback />}>
              <ReviewSession />
            </Suspense>
          }
        />
        <Route path="/m/:cat/:sub/:mod" element={<ModuleExperience />}>
          <Route index element={<ContextIntro />} />
          <Route path="book" element={<BookStage />} />
          <Route path="story" element={<StoryFeed />} />
          <Route path="quiz" element={<QuizStage />} />
          <Route path="flashcards" element={<FlashcardStage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
