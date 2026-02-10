
import { createClient } from '@/utils/supabase/server';
import ListingActions from './ListingActions';
import { Badge } from '@/components/ui/badge';

export default async function ScrapedJobsPage() {
  const supabase = await createClient();

  // Fetch scraped listings
  const { data: listings, error } = await supabase
    .from('scraped_listings')
    .select('*')
    .neq('status', 'processed') // Filter out processed ones
    .neq('status', 'discarded')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.message.includes('relation "public.scraped_listings" does not exist')) {
      return (
        <div className="p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Setup Required</h1>
          <p className="mb-4 text-red-500">The growth engine tables are missing.</p>
          <div className="bg-gray-900 p-4 rounded text-sm font-mono overflow-auto">
            Please run `growth_tables_migration.sql`
          </div>
        </div>
      )
    }
    return <div className="p-8">Error loading listings: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Growth Engine: Scraped Feed</h1>
          <p className="text-muted-foreground mt-2">
            Raw opportunities scraped from social channels. Convert them to GridPass Listings.
          </p>
        </div>
        <div className="bg-blue-600/10 text-blue-500 px-4 py-2 rounded-full font-medium">
          {listings?.length || 0} Opportunities Found
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {listings?.map((job) => (
          <div key={job.id} className="bg-card border border-border rounded-xl p-6 flex flex-col hover:border-primary/50 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline">
                {job.type || 'UNKNOWN'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>

            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{job.title}</h3>

            <div className="text-sm text-muted-foreground mb-4 line-clamp-4 flex-grow whitespace-pre-wrap">
              {job.description}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold">
                {job.origin_author_name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{job.origin_author_name}</p>
                <p className="text-xs text-muted-foreground">Original Poster</p>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <ListingActions listing={job} />

              <a
                href={job.origin_url || '#'}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:underline"
              >
                Source
              </a>
            </div>
          </div>
        ))}

        {(!listings || listings.length === 0) && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 border border-dashed rounded-lg">
            No new listings found. Run the Growth Agent to find more.
          </div>
        )}
      </div>
    </div>
  );
}
