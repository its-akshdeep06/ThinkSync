'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NavigationHeader } from '@/components/navigation-header'
import { RiskBadge } from '@/components/risk-badge'
import { KnowledgeGraph } from '@/components/knowledge-graph'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubIcon, GitHubRepoCard, GitHubBranchBadge } from '@/components/github-icon'

interface Repository {
  id: string
  name: string
  health: 'safe' | 'review' | 'high'
  fileCount: number
  nodeCount: number
  lastIndexed: string
}

interface IntentHistory {
  id: string
  description: string
  timestamp: string
  status: 'complete' | 'pending' | 'error'
}

const mockRepos: Repository[] = [
  { id: '1', name: 'acme-corp/payment-service', health: 'safe', fileCount: 234, nodeCount: 1893, lastIndexed: '2 min ago' },
  { id: '2', name: 'acme-corp/user-auth', health: 'review', fileCount: 156, nodeCount: 892, lastIndexed: '1 hour ago' },
  { id: '3', name: 'acme-corp/api-gateway', health: 'safe', fileCount: 89, nodeCount: 445, lastIndexed: '3 hours ago' },
  { id: '4', name: 'acme-corp/dashboard', health: 'high', fileCount: 312, nodeCount: 2156, lastIndexed: '1 day ago' },
]

const mockIntents: IntentHistory[] = [
  { id: '1', description: 'Add rate limiting to payment endpoints', timestamp: '09:14:15', status: 'complete' },
  { id: '2', description: 'Refactor authentication middleware', timestamp: '08:45:22', status: 'complete' },
  { id: '3', description: 'Update currency conversion logic', timestamp: '08:12:03', status: 'pending' },
]

const healthColors = {
  safe: 'bg-ts-emerald',
  review: 'bg-ts-amber',
  high: 'bg-ts-red',
}

const statusIcons = {
  complete: { icon: '✓', color: 'text-ts-emerald' },
  pending: { icon: '→', color: 'text-ts-indigo' },
  error: { icon: '×', color: 'text-ts-red' },
}

export default function DashboardPage() {
  const [selectedRepo, setSelectedRepo] = useState<Repository>(mockRepos[0])
  
  return (
    <div className="min-h-screen bg-ts-base relative">
      {/* Dynamic background - subtle for dashboard */}
      <div className="fixed inset-0 z-0 opacity-30">
        <DynamicBackground />
      </div>
      
      <NavigationHeader currentPath="~/dashboard" />
      
      <div className="relative z-10 pt-12 flex h-screen">
        {/* Sidebar - Repository List */}
        <aside className="w-[280px] bg-ts-surface/95 backdrop-blur-sm border-r border-ts-border overflow-y-auto">
          <div className="p-4">
            {/* GitHub Connected Header */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-ts-border">
              <div className="p-2 rounded-full bg-ts-elevated border border-ts-border">
                <GitHubIcon size={16} className="text-ts-text-muted" />
              </div>
              <div>
                <p className="font-mono text-[11px] text-ts-text-primary">GitHub Connected</p>
                <p className="font-mono text-[9px] text-ts-emerald flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-ts-emerald rounded-full animate-pulse" />
                  4 repositories synced
                </p>
              </div>
            </div>
            
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-4">
              Repositories
            </p>
            
            <div className="space-y-2">
              {mockRepos.map(repo => (
                <button
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  className={`w-full text-left p-3 rounded border transition-all duration-200 ${
                    selectedRepo.id === repo.id 
                      ? 'bg-ts-elevated border-ts-emerald/50' 
                      : 'bg-ts-elevated/30 border-ts-border hover:border-ts-text-ghost hover:bg-ts-elevated/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <GitHubIcon size={14} className="text-ts-text-dim shrink-0" />
                    <span className="font-mono text-[11px] text-ts-text-primary truncate">
                      {repo.name.split('/')[1]}
                    </span>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${healthColors[repo.health]}`} />
                  </div>
                  <p className="font-mono text-[9px] text-ts-text-ghost mb-2 truncate pl-[22px]">
                    {repo.name}
                  </p>
                  <div className="flex items-center gap-3 pl-[22px]">
                    <span className="font-mono text-[8px] text-ts-text-dim">
                      {repo.fileCount} files
                    </span>
                    <span className="font-mono text-[8px] text-ts-text-dim">
                      {repo.nodeCount} nodes
                    </span>
                  </div>
                  <p className="font-mono text-[8px] text-ts-text-ghost mt-1 pl-[22px]">
                    indexed {repo.lastIndexed}
                  </p>
                </button>
              ))}
            </div>
            
            <button className="w-full mt-4 p-3 border border-dashed border-ts-border rounded font-mono text-[10px] text-ts-text-dim hover:text-ts-emerald hover:border-ts-emerald transition-colors flex items-center justify-center gap-2 group">
              <GitHubIcon size={14} className="group-hover:scale-110 transition-transform" />
              Connect Repository
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-ts-base/50 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <GitHubIcon size={20} className="text-ts-text-dim" />
                <h1 className="font-mono text-[16px] font-medium text-ts-text-primary">
                  {selectedRepo.name}
                </h1>
                <RiskBadge 
                  level={selectedRepo.health} 
                  percentage={selectedRepo.health === 'safe' ? 12 : selectedRepo.health === 'review' ? 45 : 78} 
                />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <GitHubBranchBadge branch="main" />
                <p className="font-mono text-[10px] text-ts-text-dim">
                  {selectedRepo.fileCount} files · {selectedRepo.nodeCount} nodes · Last indexed {selectedRepo.lastIndexed}
                </p>
              </div>
            </div>
            
            <Link
              href={`/repo/${selectedRepo.id}/intent`}
              className="font-mono text-[10px] uppercase tracking-wider text-ts-emerald border border-ts-emerald px-4 py-2 rounded hover:bg-ts-emerald-dim transition-colors"
            >
              New Intent
            </Link>
          </div>
          
          {/* Mini Knowledge Graph */}
          <div className="mb-8">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-3">
              Knowledge Graph Preview
            </p>
            <Link 
              href={`/repo/${selectedRepo.id}/graph`}
              className="block bg-ts-surface border border-ts-border rounded overflow-hidden hover:border-ts-text-ghost transition-colors"
            >
              <div className="h-[240px] relative">
                <KnowledgeGraph className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-ts-surface to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 font-mono text-[9px] text-ts-text-dim">
                  Click to explore full graph →
                </div>
              </div>
            </Link>
          </div>
          
          {/* Intent History */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-3">
              Recent Intents
            </p>
            <div className="bg-ts-surface border border-ts-border rounded">
              {mockIntents.map((intent, i) => (
                <Link
                  key={intent.id}
                  href={`/repo/${selectedRepo.id}/plan/${intent.id}`}
                  className={`flex items-center gap-3 p-3 hover:bg-ts-elevated transition-colors ${
                    i !== mockIntents.length - 1 ? 'border-b border-ts-border' : ''
                  }`}
                >
                  <span className={`font-mono text-[12px] ${statusIcons[intent.status].color}`}>
                    {statusIcons[intent.status].icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-ts-text-primary truncate">
                      {intent.description}
                    </p>
                  </div>
                  <span className="font-mono text-[9px] text-ts-text-dim">
                    [{intent.timestamp}]
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
