'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NavigationHeader } from '@/components/navigation-header'
import { FileTree } from '@/components/file-tree'
import { NodeInspector } from '@/components/node-inspector'
import { KnowledgeGraph } from '@/components/knowledge-graph'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubIcon, GitHubBranchBadge } from '@/components/github-icon'

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

const mockFiles = [
  {
    name: 'src',
    type: 'folder' as const,
    children: [
      {
        name: 'payment',
        type: 'folder' as const,
        children: [
          { name: 'processor.ts', type: 'file' as const, nodeType: 'function' as const, risk: 'safe' as const },
          { name: 'validator.ts', type: 'file' as const, nodeType: 'function' as const, risk: 'review' as const },
          { name: 'types.ts', type: 'file' as const, nodeType: 'class' as const, risk: 'safe' as const },
        ],
      },
      {
        name: 'auth',
        type: 'folder' as const,
        children: [
          { name: 'middleware.ts', type: 'file' as const, nodeType: 'function' as const, risk: 'high' as const },
          { name: 'session.ts', type: 'file' as const, nodeType: 'class' as const, risk: 'safe' as const },
        ],
      },
      {
        name: 'utils',
        type: 'folder' as const,
        children: [
          { name: 'currency.ts', type: 'file' as const, nodeType: 'function' as const, risk: 'safe' as const },
          { name: 'format.ts', type: 'file' as const, nodeType: 'function' as const, risk: 'safe' as const },
        ],
      },
    ],
  },
]

const mockNodeData: Record<string, NodeData> = {
  'src/payment/processor.ts': {
    name: 'processCharge',
    type: 'function',
    signature: 'processCharge(amount: number, currency: string): Promise<Result>',
    lineNumber: 45,
    complexity: 12,
    risk: 'safe',
    calls: ['validateAmount', 'convertCurrency', 'createTransaction'],
    calledBy: ['handlePayment', 'processRefund'],
  },
  'src/payment/validator.ts': {
    name: 'validatePayment',
    type: 'function',
    signature: 'validatePayment(data: PaymentData): ValidationResult',
    lineNumber: 23,
    complexity: 28,
    risk: 'review',
    calls: ['checkAmount', 'verifyCard', 'validateCurrency'],
    calledBy: ['processCharge', 'createSubscription'],
  },
  'src/auth/middleware.ts': {
    name: 'authMiddleware',
    type: 'function',
    signature: 'authMiddleware(req: Request, res: Response, next: Next): void',
    lineNumber: 12,
    complexity: 45,
    risk: 'high',
    calls: ['verifyToken', 'checkPermissions', 'logAccess'],
    calledBy: ['app.use', 'router.use'],
  },
}

export default function GraphViewPage() {
  const [selectedFile, setSelectedFile] = useState<string>('src/payment/processor.ts')
  const [zoom, setZoom] = useState(1)
  
  const selectedNode = mockNodeData[selectedFile] || null
  
  return (
    <div className="min-h-screen bg-ts-base relative">
      {/* Dynamic background */}
      <div className="fixed inset-0 z-0 opacity-25">
        <DynamicBackground />
      </div>
      
      <NavigationHeader currentPath="~/acme-corp/payment-service" />
      
      <div className="relative z-10 pt-12 flex h-screen">
        {/* File Tree Sidebar */}
        <aside className="w-[200px] bg-ts-surface/95 backdrop-blur-sm border-r border-ts-border overflow-y-auto">
          {/* GitHub repo header */}
          <div className="p-3 border-b border-ts-border">
            <div className="flex items-center gap-2 mb-2">
              <GitHubIcon size={14} className="text-ts-text-dim" />
              <span className="font-mono text-[10px] text-ts-text-primary truncate">
                payment-service
              </span>
            </div>
            <GitHubBranchBadge branch="main" className="scale-90 origin-left" />
          </div>
          
          <div className="p-3 border-b border-ts-border">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">
              File Tree
            </p>
          </div>
          <FileTree 
            files={mockFiles} 
            onFileSelect={setSelectedFile}
            selectedPath={selectedFile}
          />
        </aside>
        
        {/* Main Graph Area */}
        <main className="flex-1 relative bg-ts-base">
          {/* Top Bar with Path */}
          <div className="absolute top-0 left-0 right-0 z-10 h-10 bg-ts-surface/80 backdrop-blur-sm border-b border-ts-border flex items-center px-4">
            <span className="font-mono text-[12px] text-ts-text-muted">
              {selectedFile}
            </span>
          </div>
          
          {/* Graph Canvas */}
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
          
          {/* Caption */}
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
          
          {/* Quick Actions */}
          {selectedNode && (
            <div className="p-4 border-t border-ts-border space-y-2">
              <Link
                href="/repo/1/intent"
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
