import { FacebookPagePost, FacebookPagePhoto } from '@/types/facebook';

const FACEBOOK_API_VERSION = 'v18.0';

export class FacebookClient {
    private pageId: string;
    private accessToken: string;
    private baseUrl: string;

    constructor(pageId: string, accessToken: string) {
        this.pageId = pageId;
        this.accessToken = accessToken;
        this.baseUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;
    }

    /**
     * Post a simple text message or a link to the Facebook Page feed.
     */
    async postToPage(message: string, link?: string): Promise<string> {
        const endpoint = `/${this.pageId}/feed`;
        const url = `${this.baseUrl}${endpoint}`;

        const body: any = {
            message,
            access_token: this.accessToken,
        };

        if (link) {
            body.link = link;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Facebook API Error: ${data.error?.message || 'Unknown error'}`);
        }

        return data.id;
    }

    /**
     * Upload a photo to the Facebook Page.
     */
    async postPhotoToPage(message: string, photoUrl: string): Promise<string> {
        const endpoint = `/${this.pageId}/photos`;
        const url = `${this.baseUrl}${endpoint}`;

        const body = {
            message,
            url: photoUrl,
            access_token: this.accessToken,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Facebook API Error: ${data.error?.message || 'Unknown error'}`);
        }

        return data.id; // Usually returns 'post_id' or 'id'
    }
}
