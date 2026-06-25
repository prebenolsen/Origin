import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="font-serif text-5xl text-accent">∅</div>
      <h2 className="text-xl">Nothing here</h2>
      <p className="text-sm text-muted">
        This page or module could not be found.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink"
      >
        Back to Origin
      </Link>
    </div>
  );
}
