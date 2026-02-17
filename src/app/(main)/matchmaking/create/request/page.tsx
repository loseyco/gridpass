import { createDriverRequest } from '../../actions';

export default function CreateRequestPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Find a Drive</h1>
            <form action={createDriverRequest} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Headline</label>
                    <input name="title" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Experienced Driver seeking Lemons Seat" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Experience Level</label>
                        <select name="experience_level" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                            <option value="">Select Level</option>
                            <option value="rookie">Rookie (New to racing)</option>
                            <option value="intermediate">Intermediate (Some experience)</option>
                            <option value="advanced">Advanced (Multi-season experience)</option>
                            <option value="pro">Pro (Licensed/Paid)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Budget</label>
                        <input name="budget" type="number" step="0.01" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="0.00" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Preferred Region</label>
                    <input name="preferred_region" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Northeast, West Coast, Anywhere" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Bio / Qualification Details</label>
                    <textarea name="bio" rows={4} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Tell teams about your driving history, mechanic skills, etc." />
                </div>

                <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
                    Post Request
                </button>
            </form>
        </div>
    );
}
