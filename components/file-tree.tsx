'use client'

import { useState } from 'react'

interface FileNode {
  name: string
  type: 'folder' | 'file'
  nodeType?: 'function' | 'class' | 'import' | 'file'
  risk?: 'safe' | 'review' | 'high'
  children?: FileNode[]
}

interface FileTreeProps {
  files: FileNode[]
  onFileSelect?: (path: string) => void
  selectedPath?: string
}

const nodeTypeColors = {
  function: 'bg-ts-indigo',
  class: 'bg-ts-emerald',
  import: 'bg-ts-amber',
  file: 'bg-ts-text-dim',
}

const riskColors = {
  safe: 'bg-ts-emerald',
  review: 'bg-ts-amber',
  high: 'bg-ts-red',
}

function FileTreeItem({ 
  node, 
  depth = 0, 
  path = '',
  onSelect,
  selectedPath,
}: { 
  node: FileNode
  depth?: number
  path?: string
  onSelect?: (path: string) => void
  selectedPath?: string
}) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const currentPath = path ? `${path}/${node.name}` : node.name
  const isSelected = selectedPath === currentPath
  
  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center gap-2 py-1 px-2 hover:bg-ts-elevated transition-colors text-left ${
            isSelected ? 'bg-ts-elevated' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="font-mono text-[10px] text-ts-text-dim">
            {isOpen ? '▼' : '▶'}
          </span>
          <span className="font-mono text-[10px] text-ts-text-muted">
            {node.name}
          </span>
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map((child, i) => (
              <FileTreeItem 
                key={i} 
                node={child} 
                depth={depth + 1} 
                path={currentPath}
                onSelect={onSelect}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <button
      onClick={() => onSelect?.(currentPath)}
      className={`w-full flex items-center gap-2 py-1 px-2 hover:bg-ts-elevated transition-colors text-left ${
        isSelected ? 'bg-ts-elevated' : ''
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${
        node.risk ? riskColors[node.risk] : (node.nodeType ? nodeTypeColors[node.nodeType] : nodeTypeColors.file)
      }`} />
      <span className="font-mono text-[10px] text-ts-text-secondary truncate">
        {node.name}
      </span>
    </button>
  )
}

export function FileTree({ files, onFileSelect, selectedPath }: FileTreeProps) {
  return (
    <div className="py-2">
      {files.map((file, i) => (
        <FileTreeItem 
          key={i} 
          node={file} 
          onSelect={onFileSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  )
}
