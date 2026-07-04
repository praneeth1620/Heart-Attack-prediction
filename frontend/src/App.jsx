import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || ''

const DEFAULT_FORM = {
  age: 55,
  sex: 'Male',
  cholesterol: 220,
  systolic: 130,
  diastolic: 80,
  heart_rate: 72,
  diabetes: 0,
  family_history: 0,
  smoking: 0,
  obesity: 0,
  alcohol_consumption: 0,
  exercise_hours_per_week: 4,
  diet: 'Average',
  previous_heart_problems: 0,
  medication_use: 0,
  stress_level: 5,
  sedentary_hours_per_day: 6,
  income: 75000,
  bmi: 26,
  triglycerides: 180,
  physical_activity_days_per_week: 3,
  sleep_hours_per_day: 7,
  country: 'USA',
  continent: 'North America',
  hemisphere: 'Northern',
}

const SECTIONS = [
  {
    id: 'demographics',
    title: 'Demographics',
    icon: '👤',
    fields: [
      { key: 'age', label: 'Age', type: 'number', min: 1, max: 120 },
      { key: 'sex', label: 'Sex', type: 'select', optionKey: 'sex' },
      { key: 'country', label: 'Country', type: 'select', optionKey: 'country' },
      { key: 'continent', label: 'Continent', type: 'select', optionKey: 'continent' },
      { key: 'hemisphere', label: 'Hemisphere', type: 'select', optionKey: 'hemisphere' },
      { key: 'income', label: 'Annual Income ($)', type: 'number', min: 0, step: 1000 },
    ],
  },
  {
    id: 'vitals',
    title: 'Vital Signs',
    icon: '🫀',
    fields: [
      { key: 'cholesterol', label: 'Cholesterol (mg/dL)', type: 'number', min: 50, max: 600 },
      { key: 'systolic', label: 'Systolic BP (mmHg)', type: 'number', min: 70, max: 250 },
      { key: 'diastolic', label: 'Diastolic BP (mmHg)', type: 'number', min: 40, max: 150 },
      { key: 'heart_rate', label: 'Heart Rate (bpm)', type: 'number', min: 30, max: 220 },
      { key: 'bmi', label: 'BMI', type: 'number', min: 10, max: 60, step: 0.1 },
      { key: 'triglycerides', label: 'Triglycerides (mg/dL)', type: 'number', min: 20, max: 600 },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    icon: '🏃',
    fields: [
      { key: 'diet', label: 'Diet Quality', type: 'select', optionKey: 'diet' },
      { key: 'exercise_hours_per_week', label: 'Exercise (hrs/week)', type: 'number', min: 0, max: 30, step: 0.5 },
      { key: 'physical_activity_days_per_week', label: 'Active Days/Week', type: 'number', min: 0, max: 7 },
      { key: 'sleep_hours_per_day', label: 'Sleep (hrs/day)', type: 'number', min: 1, max: 16, step: 0.5 },
      { key: 'sedentary_hours_per_day', label: 'Sedentary Hours/Day', type: 'number', min: 0, max: 24, step: 0.5 },
      { key: 'stress_level', label: 'Stress Level (1–10)', type: 'range', min: 1, max: 10, step: 1 },
      { key: 'smoking', label: 'Smoking', type: 'toggle' },
      { key: 'alcohol_consumption', label: 'Alcohol Consumption', type: 'toggle' },
      { key: 'obesity', label: 'Obesity', type: 'toggle' },
    ],
  },
  {
    id: 'medical',
    title: 'Medical History',
    icon: '🩺',
    fields: [
      { key: 'diabetes', label: 'Diabetes', type: 'toggle' },
      { key: 'family_history', label: 'Family History of Heart Disease', type: 'toggle' },
      { key: 'previous_heart_problems', label: 'Previous Heart Problems', type: 'toggle' },
      { key: 'medication_use', label: 'On Medication', type: 'toggle' },
    ],
  },
]

function HeartIcon() {
  return (
    <svg className="logo-heart" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function RiskGauge({ probability, riskLevel }) {
  const pct = Math.round(probability * 100)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (probability * circumference)

  return (
    <div className={`risk-gauge risk-gauge--${riskLevel}`}>
      <svg viewBox="0 0 120 120" className="gauge-ring">
        <circle cx="60" cy="60" r="54" className="gauge-track" />
        <circle
          cx="60"
          cy="60"
          r="54"
          className="gauge-fill"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-value">{pct}%</span>
        <span className="gauge-label">Risk Score</span>
      </div>
    </div>
  )
}

function FormField({ field, value, options, onChange }) {
  if (field.type === 'toggle') {
    return (
      <label className="field field--toggle">
        <span className="field-label">{field.label}</span>
        <button
          type="button"
          className={`toggle ${value ? 'toggle--on' : ''}`}
          onClick={() => onChange(field.key, value ? 0 : 1)}
          aria-pressed={Boolean(value)}
        >
          <span className="toggle-thumb" />
          <span className="toggle-text">{value ? 'Yes' : 'No'}</span>
        </button>
      </label>
    )
  }

  if (field.type === 'select') {
    const opts = options[field.optionKey] || []
    return (
      <label className="field">
        <span className="field-label">{field.label}</span>
        <select
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          {opts.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>
    )
  }

  if (field.type === 'range') {
    return (
      <label className="field field--range">
        <span className="field-label">{field.label}</span>
        <div className="range-wrap">
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={value}
            onChange={(e) => onChange(field.key, Number(e.target.value))}
          />
          <span className="range-value">{value}</span>
        </div>
      </label>
    )
  }

  return (
    <label className="field">
      <span className="field-label">{field.label}</span>
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step || 1}
        value={value}
        onChange={(e) => onChange(field.key, Number(e.target.value))}
      />
    </label>
  )
}

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [options, setOptions] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('demographics')

  useEffect(() => {
    fetch(`${API_BASE}/api/options`)
      .then((res) => res.json())
      .then(setOptions)
      .catch(() => setError('Could not connect to the prediction server.'))
  }, [])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const detail = await res.json()
        throw new Error(detail.detail || 'Prediction failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm(DEFAULT_FORM)
    setResult(null)
    setError(null)
  }

  const currentSection = SECTIONS.find((s) => s.id === activeSection)

  return (
    <div className="app">
      <div className="bg-pattern" aria-hidden="true" />

      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">
              <HeartIcon />
              <span className="pulse-ring" />
            </div>
            <div>
              <h1>CardioGuard</h1>
              <p>Heart Attack Risk Assessment</p>
            </div>
          </div>
          <div className="header-badge">
            <span className="badge-dot" />
            ML-Powered Analysis
          </div>
        </div>
      </header>

      <main className="main">
        <section className="intro">
          <h2>Understand your cardiovascular risk</h2>
          <p>
            Enter patient health metrics below. Our gradient boosting model analyzes
            25 clinical and lifestyle factors to estimate heart attack risk.
          </p>
        </section>

        <div className="layout">
          <aside className="sidebar">
            <nav className="section-nav">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`nav-item ${activeSection === section.id ? 'nav-item--active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="nav-icon">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </nav>

            <div className="sidebar-info">
              <h3>About this tool</h3>
              <p>
                This predictor is for educational purposes only and does not replace
                professional medical advice, diagnosis, or treatment.
              </p>
            </div>
          </aside>

          <div className="content">
            <form onSubmit={handleSubmit} className="prediction-form">
              <div className="form-card">
                <div className="form-card-header">
                  <span className="section-icon">{currentSection.icon}</span>
                  <h3>{currentSection.title}</h3>
                </div>

                <div className="form-grid">
                  {currentSection.fields.map((field) => (
                    <FormField
                      key={field.key}
                      field={field}
                      value={form[field.key]}
                      options={options}
                      onChange={updateField}
                    />
                  ))}
                </div>

                <div className="form-nav-buttons">
                  {SECTIONS.findIndex((s) => s.id === activeSection) > 0 && (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => {
                        const idx = SECTIONS.findIndex((s) => s.id === activeSection)
                        setActiveSection(SECTIONS[idx - 1].id)
                      }}
                    >
                      ← Previous
                    </button>
                  )}
                  {SECTIONS.findIndex((s) => s.id === activeSection) < SECTIONS.length - 1 ? (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => {
                        const idx = SECTIONS.findIndex((s) => s.id === activeSection)
                        setActiveSection(SECTIONS[idx + 1].id)
                      }}
                    >
                      Next →
                    </button>
                  ) : (
                    <button type="submit" className="btn btn--primary" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <HeartIcon />
                          Run Assessment
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {activeSection !== 'medical' && (
                <div className="quick-submit">
                  <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                    {loading ? 'Analyzing...' : 'Run Full Assessment'}
                  </button>
                </div>
              )}

              {error && (
                <div className="alert alert--error" role="alert">
                  {error}
                </div>
              )}
            </form>

            {result && (
              <div className={`result-card result-card--${result.risk_level}`}>
                <div className="result-header">
                  <div>
                    <span className={`result-badge result-badge--${result.risk_level}`}>
                      {result.risk_label}
                    </span>
                    <h3>Assessment Complete</h3>
                    <p>{result.message}</p>
                  </div>
                  <RiskGauge probability={result.probability} riskLevel={result.risk_level} />
                </div>

                <div className="result-stats">
                  <div className="stat">
                    <span className="stat-label">Confidence</span>
                    <span className="stat-value">{Math.round(result.confidence * 100)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Risk Level</span>
                    <span className={`stat-value stat-value--${result.risk_level}`}>
                      {result.risk_level.charAt(0).toUpperCase() + result.risk_level.slice(1)}
                    </span>
                  </div>
                </div>

                {result.recommendations.length > 0 && (
                  <div className="recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                      {result.recommendations.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button type="button" className="btn btn--ghost" onClick={handleReset}>
                  Start New Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>CardioGuard © 2026 — For educational use only. Always consult a healthcare provider.</p>
      </footer>
    </div>
  )
}
