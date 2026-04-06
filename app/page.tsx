'use client'

import Link from 'next/link'
import { KnowledgeGraph } from '@/components/knowledge-graph'
import { CharacterReveal } from '@/components/character-reveal'
import { CountUp } from '@/components/count-up'
import { ScrollReveal } from '@/components/scroll-reveal'
import { FlowSteps } from '@/components/flow-steps'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubConnectButton, GitHubIcon } from '@/components/github-icon'

const metrics = [
  { value: 80, suffix: '%', label: 'fewer bugs' },
  { value: 90, suffix: '%', label: 'time reduction' },
  { value: 10, suffix: 'x', label: 'faster cycles' },
  { value: 3, suffix: 'x', label: 'productivity' },
]

const features = [
  {
    icon: 'graph',
    title: 'Graph-Native Analysis',
    description: 'Every function, class, and import mapped as nodes in a living dependency graph.',
  },
  {
    icon: 'intent',
    title: 'Intent-Driven Changes',
    description: 'Describe what you want. The AI traces impact paths and generates precise diffs.',
  },
  {
    icon: 'risk',
    title: 'Risk Visualization',
    description: 'See exactly which files are touched and at what dependency depth before any change.',
  },
  {
    icon: 'terminal',
    title: 'Terminal-First Interface',
    description: 'Built for developers who live in the command line. No learning curve.',
  },
  {
    icon: 'stream',
    title: 'Streaming Analysis',
    description: 'Watch the AI work in real-time. The log IS the loading state.',
  },
  {
    icon: 'github',
    title: 'GitHub-Native PRs',
    description: 'From intent to merged PR with full audit trail, CI checks, and impact analysis.',
  },
]

function FeatureIcon({ type }: { type: string }) {
  switch (type) {
    case 'graph':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <path d="M6 8v4m0 0l6 4m-6-4l12-4m0 0v4" />
        </svg>
      )
    case 'intent':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      )
    case 'risk':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
      )
    case 'terminal':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
        </svg>
      )
    case 'stream':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      )
    case 'github':
      return <GitHubIcon size={20} />
    default:
      return null
  }
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen">
      {/* Dynamic Background - covers entire page */}
      <DynamicBackground />
      
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Knowledge Graph Overlay */}
        <div className="absolute inset-0 z-[1]">
          <KnowledgeGraph 
            className="w-full h-full opacity-40" 
            revealOnScroll={true}
          />
        </div>
        
        {/* Radial gradient overlay for text readability */}
        <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(6,10,18,0.7)_70%,_rgba(6,10,18,0.95)_100%)]" />
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          {/* GitHub integration badge */}
          <div className="mb-8 flex items-center gap-2 px-3 py-1.5 bg-ts-surface/50 backdrop-blur-sm border border-ts-border/50 rounded-full">
            <GitHubIcon size={14} className="text-ts-text-muted" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-ts-text-muted">
              GitHub Native
            </span>
            <span className="w-1.5 h-1.5 bg-ts-emerald rounded-full animate-pulse" />
          </div>
          
          <h1 className="font-mono text-[48px] md:text-[64px] font-medium text-ts-text-primary mb-6 tracking-tight">
            <span className="text-ts-indigo">//</span> ThinkSync
          </h1>
          
          <CharacterReveal 
            text="intent becomes execution."
            className="font-mono text-[22px] md:text-[28px] font-medium text-ts-emerald tracking-tight"
          />
          
          <p className="mt-6 max-w-lg font-sans text-[13px] text-ts-text-muted leading-relaxed">
            AI-native codebase intelligence. Connect your GitHub repos, map your code as a knowledge graph, 
            describe changes in plain English, and ship with confidence.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/dashboard">
              <GitHubConnectButton size="large" />
            </Link>
            <Link 
              href="#features"
              className="font-mono text-[10px] uppercase tracking-wider text-ts-text-dim hover:text-ts-text-muted transition-colors"
            >
              Learn more
            </Link>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="font-mono text-[8px] uppercase tracking-wider text-ts-text-ghost">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-ts-emerald/50 to-transparent" />
        </div>
      </section>
      
      {/* Flow Steps Section */}
      <section className="relative z-20 bg-ts-base px-4 py-24">
        <ScrollReveal>
          <h2 className="font-mono text-[16px] font-medium text-ts-text-primary text-center mb-4">
            Five steps. Zero friction.
          </h2>
        </ScrollReveal>
        
        <FlowSteps />
      </section>
      
      {/* Metrics Section */}
      <section className="relative z-20 bg-ts-surface py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim text-center mb-12">
              Impact Metrics
            </p>
          </ScrollReveal>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric, i) => (
              <ScrollReveal key={metric.label} delay={i * 150}>
                <div className="text-center">
                  <CountUp 
                    end={metric.value}
                    suffix={metric.suffix}
                    className="font-mono text-[42px] font-medium text-ts-emerald"
                  />
                  <p className="mt-2 font-sans text-[10px] text-ts-text-muted">
                    {metric.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="relative z-20 bg-ts-base py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="font-mono text-[16px] font-medium text-ts-text-primary text-center mb-16">
              Signature Patterns
            </h2>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 80}>
                <div className="group p-6 bg-ts-surface border border-ts-border rounded transition-all duration-300 hover:border-ts-emerald/50 hover:bg-ts-elevated">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-ts-elevated border border-ts-border text-ts-text-dim group-hover:text-ts-emerald group-hover:border-ts-emerald/30 transition-colors">
                      <FeatureIcon type={feature.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono text-[12px] font-medium text-ts-text-primary mb-2 group-hover:text-ts-emerald transition-colors">
                        {feature.title}
                      </h3>
                      <p className="font-sans text-[10px] text-ts-text-muted leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      
      {/* Code Preview Section */}
      <section className="relative z-20 bg-ts-surface py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal>
            <div className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-4">
              // path navigation — always monospace
            </div>
            <div className="font-mono text-[12px] text-ts-text-muted mb-8">
              ~/repos/acme-corp / payment / processor.ts
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <div className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-4">
              // status log line — timestamped, color-coded
            </div>
            <div className="space-y-1 mb-8">
              <div className="font-mono text-[10px]">
                <span className="text-ts-text-dim">[09:14:15]</span>
                <span className="text-ts-emerald ml-2">✓</span>
                <span className="text-ts-text-secondary ml-2">23 dependency touch-points identified</span>
              </div>
              <div className="font-mono text-[10px]">
                <span className="text-ts-text-dim">[09:14:16]</span>
                <span className="text-ts-indigo ml-2">→</span>
                <span className="text-ts-indigo ml-2">generating change plan...</span>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <div className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-4">
              // diff view — unchanged / removed / added
            </div>
            <div className="bg-ts-elevated border border-ts-border rounded p-4 space-y-1">
              <div className="font-mono text-[10px] text-ts-text-muted">
                const amount = charge.total;
              </div>
              <div className="font-mono text-[10px] text-ts-red bg-ts-red-dim px-2 py-0.5 -mx-2">
                - processCharge(amount, &apos;USD&apos;);
              </div>
              <div className="font-mono text-[10px] text-ts-emerald bg-ts-emerald-dim px-2 py-0.5 -mx-2">
                + const rate = await currency.convert(amount, &apos;USD&apos;, target);
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="relative z-20 bg-ts-base py-32 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <p className="font-mono text-[16px] text-ts-text-primary mb-8">
              Ready to ship with confidence?
            </p>
            <Link 
              href="/dashboard"
              className="inline-block font-mono text-[10px] uppercase tracking-wider text-ts-emerald border border-ts-emerald px-6 py-3 rounded hover:bg-ts-emerald-dim transition-colors"
            >
              Connect GitHub
            </Link>
          </ScrollReveal>
        </div>
      </section>
      
      {/* Minimal Footer */}
      <footer className="relative z-20 bg-ts-base border-t border-ts-border py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-mono text-[10px] text-ts-text-ghost">
            // ThinkSync
          </span>
          <span className="font-sans text-[8px] text-ts-text-ghost">
            intent becomes execution.
          </span>
        </div>
      </footer>
    </main>
  )
}
