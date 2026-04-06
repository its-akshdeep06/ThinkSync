'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { NavigationHeader } from '@/components/navigation-header'
import { FileTree } from '@/components/file-tree'
import { NodeInspector } from '@/components/node-inspector'
import { KnowledgeGraph } from '@/components/knowledge-graph'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubIcon, GitHubBranchBadge } from '@/components/github-icon'
import { api } from '@/lib/api'

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

function buildFileTree(files: string[]): any[] {
  const tree: any = {}
  for (const file of files) {
    const parts = file.split('/')
    let current = tree
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        // File
        const ext = part.split('.').pop() || ''
        current[part] = { type: 'file', nodeType: 'function', risk: 'safe' }
      } else {
        // Folder
        if (!current[part]) current[part] = { __children: {} }
        current = current[part].__children || current[part]
      }
    }
  }

  function toList(node: any): any[] {
    const result: any[] = []
    for (const [key, value] of Object.entries(node).sort()) {
      if (key === '__children') continue
      const val = value as any
      if (val.__children) {
        result.push({
          name: key,
          type: 'folder',
          children: toList(val.__children),
        })
      } else if (val.type === 'file') {
        result.push({
          name: key,
          type: 'file',
          nodeType: val.nodeType || 'function',
          risk: val.risk || 'safe',
        })
      }
    }
    return result
  }

  return toList(tree)
}

function GraphContent() {
  const params = useParams()
  const repoId = params.id as string

  const [repoName, setRepoName] = useState('loading...')
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [graphData, setGraphData] = useState<any>(null)
  const [fileTree, setFileTree] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [repoRes, graphRes] = await Promise.all([
          api.repos.get(repoId),
          api.repos.getGraph(repoId),
        ])
        setRepoName(repoRes.repo.name)
        setGraphData(graphRes)

        if (graphRes.files && graphRes.files.length > 0) {
          setFileTree(buildFileTree(graphRes.files))
          setSelectedFile(graphRes.files[0])
        }
      } catch (err) {
        console.error('Failed to load graph:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [repoId])

  // Build node data for inspector from graph data
  const selectedNode: NodeData | null = (() => {
    if (!graphData || !selectedFile) return null
    const node = graphData.nodes?.find((n: any) => n.file === selectedFile || n.id === selectedFile)
    if (!node) return null
    return {
      name: node.name || selectedFile.split('/').pop() || '',
      type: node.type || 'file',
      signature: node.type === 'function' ? `${node.name}()` : undefined,
      lineNumber: node.start_line || 1,
      complexity: 0,
      risk: 'safe' as const,
      calls: [],
      calledBy: [],
    }
  })()

  return (
    <div className="min-h-screen bg-ts-base relative">
      <div className="fixed inset-0 z-0 opacity-25">
        <DynamicBackground />
      </div>

      <NavigationHeader currentPath={`~/${repoName}/graph`} />

      <div className="relative z-10 pt-12 flex h-screen">
        {/* File Tree Sidebar */}
        <aside className="w-[200px] bg-ts-surface/95 backdrop-blur-sm border-r border-ts-border overflow-y-auto">
          <div className="p-3 border-b border-ts-border">
            <div className="flex items-center gap-2 mb-2">
              <GitHubIcon size={14} className="text-ts-text-dim" />
              <span className="font-mono text-[10px] text-ts-text-primary truncate">
                {repoName}
              </span>
            </div>
            <GitHubBranchBadge branch="main" className="scale-90 origin-left" />
          </div>

          <div className="p-3 border-b border-ts-border">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">
              File Tree
            </p>
            {graphData?.stats && (
              <p className="font-mono text-[8px] text-ts-text-ghost mt-1">
                {graphData.stats.total_files} files · {graphData.stats.total_nodes} nodes
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="p-4 text-center">
              <div className="w-4 h-4 border border-ts-emerald border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="font-mono text-[8px] text-ts-text-dim">Loading...</p>
            </div>
          ) : fileTree.length > 0 ? (
            <FileTree
              files={fileTree}
              onFileSelect={setSelectedFile}
              selectedPath={selectedFile}
            />
          ) : (
            <div className="p-4 text-center">
              <p className="font-mono text-[9px] text-ts-text-dim">No files indexed yet</p>
            </div>
          )}
        </aside>

        {/* Main Graph Area */}
        <main className="flex-1 relative bg-ts-base">
          <div className="absolute top-0 left-0 right-0 z-10 h-10 bg-ts-surface/80 backdrop-blur-sm border-b border-ts-border flex items-center px-4">
            <span className="font-mono text-[12px] text-ts-text-muted">
              {selectedFile || 'Select a file to inspect'}
            </span>
          </div>

          <div className="w-full h-full pt-10">
            <KnowledgeGraph
              className="w-full h-full"
              interactive={true}
              showMinimap={true}
            />
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-ts-surface border border-ts-border rounded p-1">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="w-6 h-6 flex items-center justify-center font-mono text-[12px] text-ts-text-muted hover:text-ts-text-primary transition-colors"
            >
              -
            </button>
            <span className="font-mono text-[9px] text-ts-text-dim w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="w-6 h-6 flex items-center justify-center font-mono text-[12px] text-ts-text-muted hover:text-ts-text-primary transition-colors"
            >
              +
            </button>
          </div>

          <div className="absolute bottom-4 right-[220px] font-sans text-[8px] text-ts-text-dim">
            viewport shown · zoom {zoom.toFixed(1)}x
          </div>
        </main>

        {/* Node Inspector Sidebar */}
        <aside className="w-[200px] bg-ts-surface border-l border-ts-border overflow-y-auto">
          <div className="p-3 border-b border-ts-border">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">
              Inspector
            </p>
          </div>
          <NodeInspector node={selectedNode} />

          {selectedNode && (
            <div className="p-4 border-t border-ts-border space-y-2">
              <Link
                href={`/repo/${repoId}/intent`}
                className="block w-full text-center font-mono text-[9px] text-ts-emerald border border-ts-emerald px-3 py-2 rounded hover:bg-ts-emerald-dim transition-colors"
              >
                New Intent
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default function GraphViewPage() {
  return (
    <AuthGuard>
      <GraphContent />
    </AuthGuard>
  )
}
