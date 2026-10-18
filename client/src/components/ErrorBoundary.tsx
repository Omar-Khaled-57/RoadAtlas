import { Component, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

type Props = WithTranslation & { children: ReactNode };
type State = { hasError: boolean };

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="surface-card m-8 p-8">
          <p className="section-eyebrow">{this.props.t('app.name')}</p>
          <h2 className="mt-2 text-2xl font-bold">{this.props.t('error.title')}</h2>
          <p className="mt-2 text-sm text-fg-muted">{this.props.t('error.body')}</p>
          <button
            type="button"
            className="primary-button mt-6"
            onClick={() => window.location.assign('/')}
          >
            {this.props.t('error.backHome')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryInner);
