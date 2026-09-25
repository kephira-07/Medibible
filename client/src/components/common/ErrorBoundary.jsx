import { Component } from 'react'

// Isole une zone fragile (ex : le vocal) : si elle plante, seule cette zone
// est remplacée par un message — le reste de la page (la partie) continue.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="w-full max-w-md rounded-2xl border-2 border-medi-border bg-white px-4 py-3 text-center text-xs font-semibold text-medi-petrol/60">
          {this.props.message || 'Cette fonction est momentanément indisponible.'}
        </p>
      )
    }
    return this.props.children
  }
}
