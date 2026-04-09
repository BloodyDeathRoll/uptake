import Header from '@/components/layout/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[38.4rem] md:max-w-screen-2xl mx-auto md:px-10">
        {children}
      </main>
    </div>
  )
}
