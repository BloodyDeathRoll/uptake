import Header from '@/components/layout/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg md:max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
