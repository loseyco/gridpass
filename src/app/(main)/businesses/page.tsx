import { getOrganizations } from '@/app/actions/organizations'
import BusinessDirectoryClient from './BusinessDirectoryClient'

export default async function BusinessesPage() {
  // Fetch all enabled sites initially (client will handle filtering)
  // In a real app with many records, we'd keep server filtering, but for "live search" feel on a smaller set, loading all is better.
  const orgs = await getOrganizations({
    site_enabled: true
  })

  return (
    <div className="v2-section-page">
      <div className="v2-header">
        <a href="/" className="v2-back-button">
          ← Back
        </a>
      </div>

      <div className="v2-content max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Business Directory</h1>
            <p className="text-muted-foreground text-lg">
              Discover trusted race shops, detailers, and services.
            </p>
          </div>
        </div>

        <BusinessDirectoryClient initialOrgs={orgs} />
      </div>
    </div>
  )
}
