import type { ThemeId } from "../types"

type Props = {
  theme: ThemeId
  onTheme: (theme: ThemeId) => void
}

export default function CommandBar({ theme, onTheme }: Props) {
  const isDark = theme === "ember"

  return (
    <header className="strata-header">
      <div className="strata-brand">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>FireCalendar</span>
        <small>Satellite fire climatology</small>
      </div>
      <div className="header-meta">
        <span>NASA Space Apps / 2026</span>
        <div className="theme-toggle" aria-label="Theme">
          <button
            aria-label="Use light theme"
            aria-pressed={!isDark}
            onClick={() => onTheme("paper")}
            type="button"
          >
            <span className="sun-symbol" />
          </button>
          <button
            aria-label="Use dark theme"
            aria-pressed={isDark}
            onClick={() => onTheme("ember")}
            type="button"
          >
            <span className="moon-symbol" />
          </button>
        </div>
      </div>
    </header>
  )
}
