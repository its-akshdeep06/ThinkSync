'use client'

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'header'
  content: string
  lineNumber?: number
}

interface DiffFile {
  filename: string
  lines: DiffLine[]
}

interface DiffViewerProps {
  files: DiffFile[]
}

export function DiffViewer({ files }: DiffViewerProps) {
  return (
    <div className="space-y-4">
      {files.map((file, fileIndex) => (
        <div key={fileIndex} className="bg-ts-elevated border border-ts-border rounded overflow-hidden">
          {/* File Header */}
          <div className="px-4 py-2 bg-ts-surface border-b border-ts-border">
            <span className="font-mono text-[10px] text-ts-text-muted">
              {file.filename}
            </span>
          </div>
          
          {/* Diff Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {file.lines.map((line, lineIndex) => {
                  let bgClass = ''
                  let textClass = 'text-ts-text-muted'
                  let prefix = ' '
                  
                  if (line.type === 'added') {
                    bgClass = 'bg-ts-emerald-dim'
                    textClass = 'text-ts-emerald'
                    prefix = '+'
                  } else if (line.type === 'removed') {
                    bgClass = 'bg-ts-red-dim'
                    textClass = 'text-ts-red'
                    prefix = '-'
                  } else if (line.type === 'header') {
                    bgClass = 'bg-ts-surface'
                    textClass = 'text-ts-text-dim'
                    prefix = '@'
                  }
                  
                  return (
                    <tr key={lineIndex} className={bgClass}>
                      <td className="w-12 px-2 py-0.5 text-right font-mono text-[9px] text-ts-text-ghost select-none border-r border-ts-border/50">
                        {line.lineNumber || ''}
                      </td>
                      <td className={`px-4 py-0.5 font-mono text-[10px] ${textClass} whitespace-pre`}>
                        <span className="mr-2 select-none">{prefix}</span>
                        {line.content}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
