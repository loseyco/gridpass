import fs from 'fs';
import path from 'path';

const guidesDirectory = path.join(process.cwd(), 'src/content/guides');

export type Guide = {
    slug: string;
    title: string;
    description: string;
    category: string;
    status: 'Live' | 'Beta' | 'Alpha' | 'Coming Soon';
    content: string;
};

export function getAllGuides(): Guide[] {
    if (!fs.existsSync(guidesDirectory)) {
        return [];
    }

    const fileNames = fs.readdirSync(guidesDirectory);
    const guides = fileNames.map((fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        return getGuideBySlug(slug);
    });

    return guides;
}

export function getGuideBySlug(slug: string): Guide {
    const fullPath = path.join(guidesDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Simple frontmatter parser
    // Simple frontmatter parser handles both LF and CRLF
    const match = fileContents.match(/^---\s+([\s\S]*?)\s+---\s+([\s\S]*)$/);

    if (!match) {
        return {
            slug,
            title: slug,
            description: '',
            category: 'Uncategorized',
            status: 'Coming Soon',
            content: fileContents,
        };
    }

    const frontmatterRaw = match[1];
    const content = match[2];

    const frontmatter: any = {};
    frontmatterRaw.split('\n').forEach((line) => {
        const [key, ...value] = line.split(':');
        if (key && value) {
            frontmatter[key.trim()] = value.join(':').trim();
        }
    });

    return {
        slug,
        title: frontmatter.title || slug,
        description: frontmatter.description || '',
        category: frontmatter.category || 'General',
        status: frontmatter.status || 'Coming Soon',
        content,
    };
}
