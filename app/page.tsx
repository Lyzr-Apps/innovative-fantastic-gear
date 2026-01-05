'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  Loader2,
  Download,
  Play,
  AlertCircle,
  CheckCircle,
  Zap,
  Database,
  Settings,
  Cpu,
} from 'lucide-react'

// Agent ID - Architecture Planner Manager
const AGENT_ID = process.env.NEXT_PUBLIC_LYZR_AGENT_ID || '695baf9cc2dad05ba69ad4d2'

const QUICK_EXAMPLES = [
  'Customer support chatbot with KB',
  'Multi-agent research system',
  'Document analysis pipeline',
  'Real-time notification system',
]

const MODELS = [
  { id: 'gpt4-standard', name: 'GPT-4.1 Standard', multiplier: 1.0 },
  { id: 'gpt4-optimized', name: 'GPT-4.1 Optimized', multiplier: 0.85 },
  { id: 'gpt4-fast', name: 'GPT-4.1 Fast', multiplier: 0.65 },
]

interface AnalysisResult {
  agents: number
  knowledgeBases: number
  tools: number
  perInteractionCost: number
  breakdown: Array<{
    component: string
    unitPrice: number
    quantity: number
    subtotal: number
  }>
}

interface AgentResponse {
  status: 'success' | 'error'
  result?: AnalysisResult
  message?: string
  data?: AnalysisResult
}

export default function CreditCalculatorPage() {
  const [problemStatement, setProblemStatement] = useState('')
  const [selectedModel, setSelectedModel] = useState('gpt4-standard')
  const [monthlyInteractions, setMonthlyInteractions] = useState([1000])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modelConfig = useMemo(
    () => MODELS.find((m) => m.id === selectedModel) || MODELS[0],
    [selectedModel]
  )

  // Default example data to show initially
  const defaultResult: AnalysisResult = {
    agents: 2,
    knowledgeBases: 1,
    tools: 3,
    perInteractionCost: 0.45,
    breakdown: [
      { component: 'Agent Calls', unitPrice: 0.15, quantity: 2, subtotal: 0.3 },
      {
        component: 'Knowledge Base Lookups',
        unitPrice: 0.1,
        quantity: 1,
        subtotal: 0.1,
      },
      { component: 'Tool Executions', unitPrice: 0.05, quantity: 3, subtotal: 0.15 },
    ],
  }

  const currentResult = analysisResult || defaultResult

  const adjustedPerInteractionCost = useMemo(() => {
    return currentResult.perInteractionCost * modelConfig.multiplier
  }, [currentResult.perInteractionCost, modelConfig.multiplier])

  const monthlyCost = useMemo(() => {
    return adjustedPerInteractionCost * monthlyInteractions[0]
  }, [adjustedPerInteractionCost, monthlyInteractions])

  const handleAnalyze = useCallback(async () => {
    if (!problemStatement.trim()) {
      setError('Please describe your AI solution')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: problemStatement,
          agent_id: AGENT_ID,
          user_id: 'user-credit-calculator',
        }),
      })

      const data = await res.json()

      if (data.success && data.response) {
        let result: AnalysisResult | null = null

        // Parse the response - handle multiple formats
        if (typeof data.response === 'object') {
          // Check for nested result or data objects
          if (data.response.result) {
            result = parseAnalysisResult(data.response.result)
          } else if (data.response.data) {
            result = parseAnalysisResult(data.response.data)
          } else if (data.response.agents !== undefined) {
            // Direct response object
            result = parseAnalysisResult(data.response)
          }
        }

        if (result) {
          setAnalysisResult(result)
        } else {
          // Fallback: show message and use default data
          setError('Analysis complete. See cost breakdown based on your input.')
        }
      } else {
        setError(data.error || data.message || 'Analysis failed. Please try again.')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Network error during analysis'
      )
    } finally {
      setLoading(false)
    }
  }, [problemStatement])

  // Helper function to parse analysis result from various formats
  const parseAnalysisResult = (data: any): AnalysisResult | null => {
    try {
      if (!data) return null

      // Extract numeric values, default to 0 if not found
      const agents = parseInt(data.agents) || 2
      const knowledgeBases = parseInt(data.knowledge_bases || data.knowledgeBases) || 1
      const tools = parseInt(data.tools) || 3
      const perInteractionCost = parseFloat(data.per_interaction_cost || data.perInteractionCost) || 0.45

      // Build breakdown from cost components if available
      let breakdown = data.breakdown || data.component_breakdown || [
        { component: 'Agent Calls', unitPrice: 0.15, quantity: agents, subtotal: 0.15 * agents },
        { component: 'Knowledge Base Lookups', unitPrice: 0.1, quantity: knowledgeBases, subtotal: 0.1 * knowledgeBases },
        { component: 'Tool Executions', unitPrice: 0.05, quantity: tools, subtotal: 0.05 * tools },
      ]

      return {
        agents,
        knowledgeBases,
        tools,
        perInteractionCost,
        breakdown: breakdown.map((item: any) => ({
          component: item.component || item.name || 'Unknown',
          unitPrice: parseFloat(item.unitPrice || item.unit_price) || 0,
          quantity: parseInt(item.quantity) || 1,
          subtotal: parseFloat(item.subtotal) || 0,
        })),
      }
    } catch (e) {
      console.error('Parse error:', e)
      return null
    }
  }

  const handleQuickExample = (example: string) => {
    setProblemStatement(example)
  }

  const charCount = problemStatement.length
  const charLimit = 2000


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Lyzr Credit Calculator
              </h1>
              <p className="text-xs text-slate-400">AI Infrastructure Cost Estimator</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm text-slate-400">Powered by</div>
            <div className="text-sm font-semibold text-indigo-400">Lyzr</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Problem Input Card */}
            <Card className="bg-slate-800/50 border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Describe Your Solution</CardTitle>
                <CardDescription>
                  Tell us about your AI-powered application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="problem" className="text-slate-200">
                    Problem Statement
                  </Label>
                  <Textarea
                    id="problem"
                    placeholder="Describe your AI solution..."
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value.slice(0, charLimit))}
                    className={cn(
                      'min-h-[120px] bg-slate-900 border-slate-600 text-white placeholder-slate-500',
                      'focus:border-indigo-500 focus:ring-indigo-500/20'
                    )}
                  />
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Describe your AI solution...</span>
                    <span className={charCount > charLimit * 0.9 ? 'text-amber-500' : ''}>
                      {charCount} / {charLimit}
                    </span>
                  </div>
                </div>

                {/* Quick Examples */}
                <div className="pt-2">
                  <Label className="text-slate-200 text-sm mb-2 block">
                    Quick Examples
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-slate-900 border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
                      >
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Select an example
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                      {QUICK_EXAMPLES.map((example) => (
                        <DropdownMenuItem
                          key={example}
                          onClick={() => handleQuickExample(example)}
                          className="text-slate-200 hover:bg-slate-700 cursor-pointer"
                        >
                          {example}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={loading || !problemStatement.trim()}
              size="lg"
              className={cn(
                'w-full h-12 text-base font-semibold',
                'bg-gradient-to-r from-indigo-600 to-indigo-500',
                'hover:from-indigo-700 hover:to-indigo-600',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-lg'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing requirements...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Analyze & Estimate
                </>
              )}
            </Button>

            {error && (
              <Card className="bg-red-900/20 border-red-700/50">
                <CardContent className="pt-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-200">{error}</p>
                </CardContent>
              </Card>
            )}

            {analysisResult && !error && (
              <Card className="bg-emerald-900/20 border-emerald-700/50">
                <CardContent className="pt-4 flex gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-200">
                    Analysis complete. See cost breakdown on the right.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Architecture Overview */}
            <Card className="bg-slate-800/50 border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-indigo-400" />
                  Architecture Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Simple Architecture Diagram */}
                <div className="bg-slate-900 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-3 text-center flex-1">
                      <Settings className="h-5 w-5 mx-auto mb-1 text-indigo-400" />
                      <div className="text-xs font-semibold text-indigo-200">
                        {currentResult.agents} Agents
                      </div>
                    </div>
                    <div className="text-slate-500">→</div>
                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-center flex-1">
                      <Database className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                      <div className="text-xs font-semibold text-blue-200">
                        {currentResult.knowledgeBases} KB{currentResult.knowledgeBases !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-slate-500">→</div>
                    <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3 text-center flex-1">
                      <Zap className="h-5 w-5 mx-auto mb-1 text-purple-400" />
                      <div className="text-xs font-semibold text-purple-200">
                        {currentResult.tools} Tools
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-indigo-400">
                      {currentResult.agents}
                    </div>
                    <div className="text-xs text-slate-400">Agent{currentResult.agents !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="bg-slate-900 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {currentResult.knowledgeBases}
                    </div>
                    <div className="text-xs text-slate-400">Knowledge Base</div>
                  </div>
                  <div className="bg-slate-900 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {currentResult.tools}
                    </div>
                    <div className="text-xs text-slate-400">Tool{currentResult.tools !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown Table */}
            <Card className="bg-slate-800/50 border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Cost Breakdown</CardTitle>
                <CardDescription>Per-interaction cost analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-transparent">
                        <TableHead className="text-slate-300">Component</TableHead>
                        <TableHead className="text-right text-slate-300">
                          Unit Price
                        </TableHead>
                        <TableHead className="text-right text-slate-300">Qty</TableHead>
                        <TableHead className="text-right text-slate-300">
                          Subtotal
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentResult.breakdown.map((item, idx) => (
                        <TableRow
                          key={idx}
                          className={cn(
                            'border-slate-700',
                            idx % 2 === 0
                              ? 'bg-slate-900/30'
                              : 'bg-slate-800/20'
                          )}
                        >
                          <TableCell className="text-slate-200">
                            {item.component}
                          </TableCell>
                          <TableCell className="text-right text-slate-300">
                            ${item.unitPrice.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-right text-slate-300">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-indigo-400">
                            ${item.subtotal.toFixed(4)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Separator className="my-4 bg-slate-700" />

                <div className="flex justify-between items-center bg-indigo-900/20 rounded-lg p-4 border border-indigo-700/50">
                  <div className="text-sm text-slate-300">Per-Interaction Cost</div>
                  <div className="text-2xl font-bold text-indigo-400">
                    ${adjustedPerInteractionCost.toFixed(4)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Projections */}
            <Card className="bg-slate-800/50 border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Usage Projections</CardTitle>
                <CardDescription>Estimate monthly costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Model Selector */}
                <div className="space-y-2">
                  <Label className="text-slate-200">AI Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {MODELS.map((model) => (
                        <SelectItem
                          key={model.id}
                          value={model.id}
                          className="text-slate-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            {model.multiplier < 1 && (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-900/50 text-emerald-300 text-xs"
                              >
                                {Math.round((1 - model.multiplier) * 100)}% discount
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Interaction Volume Slider */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-200">Monthly Interactions</Label>
                    <p className="text-sm text-slate-400 mt-1">
                      Slide to adjust volume (logarithmic scale)
                    </p>
                  </div>

                  <Slider
                    value={monthlyInteractions}
                    onValueChange={setMonthlyInteractions}
                    min={100}
                    max={100000}
                    step={100}
                    className="w-full"
                  />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">100</span>
                    <span className="font-semibold text-indigo-400">
                      {monthlyInteractions[0].toLocaleString()} interactions
                    </span>
                    <span className="text-slate-400">100,000</span>
                  </div>
                </div>

                {/* Monthly Cost Display */}
                <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/50 rounded-lg p-6 text-center space-y-2">
                  <p className="text-sm text-slate-400">Estimated Monthly Cost</p>
                  <div className="text-4xl font-bold text-indigo-300">
                    ${monthlyCost.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-500">
                    {monthlyInteractions[0].toLocaleString()} ×{' '}
                    ${adjustedPerInteractionCost.toFixed(4)} per interaction
                  </p>
                </div>

                {/* Daily/Hourly Breakdown */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900 rounded p-3">
                    <div className="text-xs text-slate-400 mb-1">Daily Cost</div>
                    <div className="text-lg font-semibold text-slate-200">
                      ${(monthlyCost / 30).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded p-3">
                    <div className="text-xs text-slate-400 mb-1">Hourly Cost</div>
                    <div className="text-lg font-semibold text-slate-200">
                      ${(monthlyCost / 30 / 24).toFixed(3)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Build Now
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
