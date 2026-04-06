interface NodeData {
  name: string
  type: 'function' | 'class' | 'import' | 'file'
  signature?: string
  lineNumber: number
  complexity: number
  risk: 'safe' | 'review' | 'high'
  calls: string[]
  calledBy: string[]
}

interface NodeInspectorProps {
  node: NodeData | null
}

const riskColors = {
  safe: 'text-ts-emerald',
  review: 'text-ts-amber',
  high: 'text-ts-red',
}

const typeLabels = {
  function: 'Function',
  class: 'Class',
  import: 'Import',
  file: 'File',
}

export function NodeInspector({ node }: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="font-mono text-[10px] text-ts-text-dim">
          Select a node to inspect
        </p>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-1">
          {typeLabels[node.type]}
        </p>
        <p className="font-mono text-[12px] text-ts-text-primary font-medium">
          {node.name}
        </p>
      </div>
      
      {node.signature && (
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-1">
            Signature
          </p>
          <code className="font-mono text-[10px] text-ts-indigo bg-ts-elevated px-2 py-1 rounded block overflow-x-auto">
            {node.signature}
          </code>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-1">
            Line
          </p>
          <p className="font-mono text-[10px] text-ts-text-secondary">
            {node.lineNumber}
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-1">
            Complexity
          </p>
          <p className={`font-mono text-[10px] ${riskColors[node.risk]}`}>
            {node.complexity}
          </p>
        </div>
      </div>
      
      <div>
        <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-2">
          Calls ({node.calls.length})
        </p>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {node.calls.length === 0 ? (
            <p className="font-mono text-[9px] text-ts-text-dim">None</p>
          ) : (
            node.calls.map((call, i) => (
              <div key={i} className="font-mono text-[9px] text-ts-text-muted hover:text-ts-emerald cursor-pointer transition-colors">
                → {call}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div>
        <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-2">
          Called By ({node.calledBy.length})
        </p>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {node.calledBy.length === 0 ? (
            <p className="font-mono text-[9px] text-ts-text-dim">None</p>
          ) : (
            node.calledBy.map((caller, i) => (
              <div key={i} className="font-mono text-[9px] text-ts-text-muted hover:text-ts-emerald cursor-pointer transition-colors">
                ← {caller}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
