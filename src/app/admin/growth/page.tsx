import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ScrapedJobsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   redirect('/login');
  // }

  // Fetch scraped listings
  const { data: listings, error } = await supabase
    .from('scraped_listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // If table doesn't exist yet, show instructions
    if (error.message.includes('relation "public.scraped_listings" does not exist')) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Setup Required</h1>
                <p className="mb-4 text-red-500">The growth engine tables are missing.</p>
                <div className="bg-gray-900 p-4 rounded text-sm font-mono overflow-auto">
                    Please run the migration in `gridpass/src/data/insert_jobs.sql`
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
                <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-secondary-foreground">
                    {job.origin_source || 'FACEBOOK'}
                </span>
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

            <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="bg-primary text-primary-foreground py-2 px-4 rounded text-sm font-medium hover:opacity-90 transition-opacity">
                    Create Listing
                </button>
                <a 
                    href={`https://facebook.com/search/top?q=${encodeURIComponent(job.origin_author_name)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-secondary text-secondary-foreground py-2 px-4 rounded text-sm font-medium hover:bg-secondary/80 transition-colors text-center"
                >
                    Contact
                </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
