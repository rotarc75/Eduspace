import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  componentDidCatch(error, info) {
    this.setState({ error, info })
    console.error('EduSpace crash:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0F1117', color: '#E8E9EF',
          padding: '2rem', fontFamily: 'monospace',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💥</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#F47B7B' }}>
            Erreur de rendu
          </div>
          <div style={{
            background: '#181B23', border: '1px solid rgba(244,123,123,0.3)',
            borderRadius: 10, padding: '1rem 1.5rem', maxWidth: 640, width: '100%',
            fontSize: 13, color: '#F47B7B', marginBottom: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {this.state.error?.toString()}
          </div>
          <details style={{ maxWidth: 640, width: '100%', marginBottom: 20 }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, color: '#8B8FA8', marginBottom: 6 }}>
              Stack trace
            </summary>
            <pre style={{
              background: '#181B23', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '0.75rem', fontSize: 11, color: '#8B8FA8',
              overflow: 'auto', maxHeight: 200,
            }}>
              {this.state.info?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ error: null, info: null })}
            style={{
              background: '#7B9CF4', color: '#0a0d16', border: 'none',
              borderRadius: 8, padding: '8px 20px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
