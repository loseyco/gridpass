import { getFacebookPosts } from '@/app/(main)/admin/social/actions'

export async function FacebookFeed({ accountId }: { accountId: string }) {
    const posts = await getFacebookPosts(accountId)

    if (!posts || posts.length === 0) {
        return <div className="text-sm text-gray-500 italic p-4">No recent posts found.</div>
    }

    return (
        <div className="space-y-4">
            {posts.map((post: any) => (
                <div key={post.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                        {post.full_picture && (
                            <div className="flex-shrink-0">
                                <img
                                    src={post.full_picture}
                                    alt="Post image"
                                    className="w-24 h-24 object-cover rounded-md border"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-3">
                                {post.message || <span className="text-gray-400 italic">No text content</span>}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    {new Date(post.created_time).toLocaleDateString()}
                                </span>
                                <a
                                    href={post.permalink_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    View on Facebook &rarr;
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
