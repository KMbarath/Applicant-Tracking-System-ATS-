import { Component } from 'react';

export default class RenderErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Page rendering failed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="render-error" role="alert">
          <h1>This page could not be displayed</h1>
          <p>Reload the page. If the problem continues, contact your administrator.</p>
          <button onClick={() => window.location.reload()}>Reload page</button>
        </main>
      );
    }

    return this.props.children;
  }
}
