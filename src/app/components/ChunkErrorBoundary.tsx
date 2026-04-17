import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-sm text-gray-500">
          <p>Seite konnte nicht geladen werden.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200"
          >
            Neu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
