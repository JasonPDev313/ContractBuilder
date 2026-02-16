export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your organization settings</p>
      </div>
      {children}
    </div>
  )
}
