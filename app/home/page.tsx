'use client'

import { useState } from 'react'
import { Bars3Icon, BeakerIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

// ─── Types ────────────────────────────────────────────────────────────────────

type SelectField = {
  key: string
  label: string
  type: 'select'
  options: string[]
  group: string
}

type NumberField = {
  key: string
  label: string
  type: 'number'
  placeholder: string
  unit: string
  group: string
}

type Field = SelectField | NumberField

type FormData = Record<string, string>

type PredictionResult = {
  prediction: string
  probability: number
  risk_level: 'Low' | 'Medium' | 'High'
}

// ─── Field Definitions ────────────────────────────────────────────────────────

const FIELDS: Field[] = [
  { key: 'Age', label: 'Age', type: 'number', placeholder: 'e.g. 10', unit: 'years', group: 'Demographic' },
  { key: 'Sex', label: 'Sex', type: 'select', options: ['female', 'male'], group: 'Demographic' },
  { key: 'Height', label: 'Height', type: 'number', placeholder: 'e.g. 140', unit: 'cm', group: 'Demographic' },
  { key: 'Weight', label: 'Weight', type: 'number', placeholder: 'e.g. 35', unit: 'kg', group: 'Demographic' },
  { key: 'BMI', label: 'BMI', type: 'number', placeholder: 'e.g. 17.9', unit: 'kg/m²', group: 'Demographic' },
  { key: 'Migratory_Pain', label: 'Migration of Pain', type: 'select', options: ['no', 'yes'], group: 'Clinical' },
  { key: 'Lower_Right_Abd_Pain', label: 'Tenderness in RLQ', type: 'select', options: ['no', 'yes'], group: 'Clinical' },
  { key: 'Contralateral_Rebound_Tenderness', label: 'Contralateral Rebound Tenderness', type: 'select', options: ['no', 'yes'], group: 'Clinical' },
  { key: 'Ipsilateral_Rebound_Tenderness', label: 'Ipsilateral Rebound Tenderness', type: 'select', options: ['no', 'yes'], group: 'Clinical' },
  { key: 'Coughing_Pain', label: 'Cough Tenderness', type: 'select', options: ['no', 'yes'], group: 'Clinical' },
  { key: 'Psoas_Sign', label: 'Psoas Sign', type: 'select', options: ['negative', 'positive'], group: 'Clinical' },
  { key: 'Nausea', label: 'Nausea / Vomiting', type: 'select', options: ['no', 'yes'], group: 'Clinical' },
  { key: 'Body_Temperature', label: 'Body Temperature', type: 'number', placeholder: 'e.g. 37.5', unit: '°C', group: 'Clinical' },
  { key: 'Peritonitis', label: 'Peritonitis', type: 'select', options: ['no', 'localized', 'generalized'], group: 'Clinical' },
  { key: 'WBC_Count', label: 'WBC Count', type: 'number', placeholder: 'e.g. 12.5', unit: '10³/µl', group: 'Laboratory' },
  { key: 'Neutrophil_Percentage', label: 'Neutrophils', type: 'number', placeholder: 'e.g. 78', unit: '%', group: 'Laboratory' },
  { key: 'Neutrophilia', label: 'Neutrophilia (≥75%)', type: 'select', options: ['no', 'yes'], group: 'Laboratory' },
  { key: 'CRP', label: 'C-Reactive Protein (CRP)', type: 'number', placeholder: 'e.g. 15.2', unit: 'mg/l', group: 'Laboratory' },
  { key: 'Appendix_on_US', label: 'Appendix Visible on Ultrasound', type: 'select', options: ['no', 'yes'], group: 'Imaging' },
  { key: 'Appendix_Diameter', label: 'Appendix Diameter', type: 'number', placeholder: 'e.g. 7.2', unit: 'mm', group: 'Imaging' },
  { key: 'Free_Fluids', label: 'Free Intraperitoneal Fluid', type: 'select', options: ['no', 'yes'], group: 'Imaging' },
]


const GROUP_COLORS: Record<string, string> = {
  Demographic: 'text-sky-700 border-sky-200 bg-sky-50',
  Clinical: 'text-violet-700 border-violet-200 bg-violet-50',
  Laboratory: 'text-amber-700 border-amber-200 bg-amber-50',
  Imaging: 'text-emerald-700 border-emerald-200 bg-emerald-50',
}

const riskTextColor: Record<string, string> = {
  High: 'text-red-600',
  Medium: 'text-amber-600',
  Low: 'text-green-600',
}
const riskBorderColor: Record<string, string> = {
  High: 'border-red-400',
  Medium: 'border-amber-400',
  Low: 'border-green-400',
}
const riskBarColor: Record<string, string> = {
  High: 'bg-red-500',
  Medium: 'bg-amber-500',
  Low: 'bg-green-500',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [form, setForm] = useState<FormData>({})
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [fullCheck, setFullCheck] = useState(true)

  // Visible Groups
  const visibleGroups = fullCheck
    ? ['Demographic', 'Clinical', 'Laboratory', 'Imaging']
    : ['Demographic', 'Clinical']

  const activeFields = FIELDS.filter((f) => visibleGroups.includes(f.group))

  const API_URL = fullCheck ? 'http://127.0.0.1:8000/predict' : 'http://127.0.0.1:8000/predict-clinical'

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setResult(null)
    setError(null)
  }

  const handleSubmit = async () => {
    const missing = activeFields.filter((f) => !form[f.key] && form[f.key] !== '0')
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(', ')}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = Object.fromEntries(
        activeFields.map((f) => [
          f.key,
          f.type === 'number' ? parseFloat(form[f.key]) : form[f.key],
        ])
      )

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: PredictionResult = await res.json()
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm({})
    setResult(null)
    setError(null)
  }

  const fillDummyData = () => {
    const dummyFull: FormData = {
      Age: '14.1', Sex: 'male', Height: '147.0', Weight: '69.5', BMI: '31.9',
      Migratory_Pain: 'yes', Lower_Right_Abd_Pain: 'yes',
      Contralateral_Rebound_Tenderness: 'yes', Ipsilateral_Rebound_Tenderness: 'no',
      Coughing_Pain: 'no', Psoas_Sign: 'negative', Nausea: 'no',
      Body_Temperature: '36.9', Peritonitis: 'no', WBC_Count: '8.16',
      Neutrophil_Percentage: '64.8', Neutrophilia: 'no', CRP: '3.0',
      Appendix_on_US: 'no', Appendix_Diameter: '0', Free_Fluids: 'no',
    }
    const dummyClinical: FormData = {
      Age: '14.1', Sex: 'male', Height: '147.0', Weight: '69.5', BMI: '31.9',
      Migratory_Pain: 'yes', Lower_Right_Abd_Pain: 'yes',
      Contralateral_Rebound_Tenderness: 'yes', Ipsilateral_Rebound_Tenderness: 'no',
      Coughing_Pain: 'no', Psoas_Sign: 'negative', Nausea: 'no',
      Body_Temperature: '36.9', Peritonitis: 'no',
    }
    setForm(fullCheck ? dummyFull : dummyClinical)
  }

  const switchToClinical = () => {
    setFullCheck(false)
    setForm((prev) => {
      const next = { ...prev }
      FIELDS.filter((f) => f.group === 'Laboratory' || f.group === 'Imaging').forEach((f) => {
        delete next[f.key]
      })
      return next
    })
    setResult(null)
    setError(null)
  }

  const switchToFull = () => {
    setFullCheck(true)
    setResult(null)
    setError(null)
  }

  const filledCount = activeFields.filter((f) => form[f.key] !== undefined && form[f.key] !== '').length

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">

      {/* Navigation */}
      <div className="bg-white flex shrink-0 justify-between items-center print:hidden p-5 pb-3 border-b border-gray-200 shadow-sm">
        <span className="text-gray-800 font-bold text-lg tracking-tight">AppendixAI</span>

        {/* Hamburger - mobile only */}
        <button className="md:hidden cursor-pointer" onClick={() => setDrawerOpen(true)}>
          <Bars3Icon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 bg-black/20 z-10 md:hidden" onClick={() => setDrawerOpen(false)} />
        )}

        {/* Side Panel */}
        <div className={`
          fixed md:static top-0 left-0 h-full w-80 bg-white p-5 z-20 shadow-lg
          transition-transform duration-300
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:shadow-none md:border-r md:border-gray-200
        `}>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Pediatric Appendicitis Risk Predictor</h1>
          <p className="text-sm md:text-base text-gray-600 mb-6">
            Enter clinical features to assess appendicitis risk using an ML based prediction model.
          </p>

          <ul className="text-xs md:text-sm text-gray-600 mb-6 list-disc pl-5 space-y-1">
            <li>Clinical-only model accuracy: <strong>~70%</strong></li>
            <li>Full model (with additional data) accuracy: <strong>~93%</strong></li>
            <li>This tool is for risk estimation — not a medical diagnosis</li>
            <li>Always seek professional medical advice for confirmation</li>
            <li>If risk appears medium or high, consult a doctor immediately</li>
          </ul>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Fields completed</span>
              <span>{filledCount} / {activeFields.length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-600 rounded-full transition-all duration-300"
                style={{ width: `${(filledCount / activeFields.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 items-start">
            <div
              className="flex items-center gap-2 cursor-pointer w-full rounded-lg p-2 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              onClick={fillDummyData}
            >
              <BeakerIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Load Demo Data</span>
            </div>
            <div
              className="flex items-center gap-2 cursor-pointer w-full rounded-lg p-2 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              onClick={handleReset}
            >
              <InformationCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Reset Form</span>
            </div>
          </div>

          {/* Result summary in sidebar */}
          {result && (
            <div className={`mt-6 border rounded-lg p-4 ${riskBorderColor[result.risk_level]}`}>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Last Result</p>
              <p className={`text-lg font-bold ${riskTextColor[result.risk_level]}`}>{result.prediction}</p>
              <p className="text-sm text-gray-600">{(result.probability * 100).toFixed(1)}% probability</p>
              <p className={`text-sm font-semibold ${riskTextColor[result.risk_level]}`}>{result.risk_level} Risk</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-7">
          <div className="mx-auto max-w-4xl flex flex-col gap-6">

          <div className='flex gap-6 w-full items-center'>
            <button
              className={`
                flex-1 p-1 rounded-xl cursor-pointer transition-colors duration-200
                ${!fullCheck
                  ? 'bg-slate-600 text-white hover:bg-slate-700'
                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }
              `}
              onClick={switchToClinical}
            >
              Clinical Model
            </button>
            <button
              className={`
                flex-1 p-1 rounded-xl cursor-pointer transition-colors duration-200
                ${fullCheck
                  ? 'bg-slate-600 text-white hover:bg-slate-700'
                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }
              `}
              onClick={switchToFull}
            >
              Full Model
            </button>
          </div>

            {/* Header */}
            <div className="flex flex-col gap-2">
              <span className="w-fit bg-gray-600 text-gray-100 text-xs font-mono tracking-widest uppercase px-3 py-1.5 rounded-lg">
                Clinical Decision Support Tool
              </span>
              <h1 className="text-3xl font-bold text-gray-800">
                Appendicitis Risk Assessment
              </h1>
              <p className="text-sm text-gray-600 max-w-xl">
                All{' '}
                <span className="font-semibold text-gray-800">{activeFields.length} features</span> are
                required to run a prediction.
              </p>
            </div>

            {/* Form — grouped by category */}
            <div className="flex flex-col gap-6">

              {visibleGroups.map((group) => {
                const groupFields = FIELDS.filter((f) => f.group === group)
                const colorClass = GROUP_COLORS[group]
                return (
                  <div key={group} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className={`px-5 py-3 border-b text-sm font-semibold uppercase tracking-widest ${colorClass}`}>
                      {group}
                    </div>
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
                      {groupFields.map((field) => (
                        <div key={field.key} className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            {field.label}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={form[field.key] ?? ''}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                            >
                              <option value="">Select</option>
                              {field.options.map((o) => (
                                <option key={o} value={o}>
                                  {o.charAt(0).toUpperCase() + o.slice(1)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                placeholder={field.placeholder}
                                value={form[field.key] ?? ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-16 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                              />
                              <span className="absolute right-3 text-xs text-gray-500 pointer-events-none whitespace-nowrap">
                                {field.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 text-sm rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer font-medium"
              >
                Reset
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-60 transition-colors cursor-pointer shadow-sm"
              >
                {loading ? 'Predicting...' : `Run Prediction →`}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className={`bg-white border-2 rounded-xl p-6 flex flex-col gap-4 shadow-sm ${riskBorderColor[result.risk_level]}`}>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                  Prediction Result
                </p>
                <p className={`text-2xl font-bold ${riskTextColor[result.risk_level]}`}>
                  {result.prediction}
                </p>
                <div className="flex gap-10">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Probability</span>
                    <span className="text-xl font-bold text-gray-900">
                      {(result.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Risk Level</span>
                    <span className={`text-xl font-bold ${riskTextColor[result.risk_level]}`}>
                      {result.risk_level}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${riskBarColor[result.risk_level]}`}
                    style={{ width: `${result.probability * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  ⚠ This tool is intended to assist clinical decision-making only. It is not a substitute for professional medical judgment.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}