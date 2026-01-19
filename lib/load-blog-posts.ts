import { promises as fs } from 'fs';
import path from 'path';
import type { BlogPost } from '@/types/blog-post';

type LocaleString = string | { fi: string; en?: string; sv?: string };

function getLocaleString(value: LocaleString, locale: string): string {
    if (typeof value === 'string') {
        return value;
    }
    return value[locale as keyof typeof value] || value.en || value.fi;
}

function selectLocaleForPost(post: BlogPost, locale: string): BlogPost {
    return {
        ...post,
        title: getLocaleString(post.title, locale),
        description: getLocaleString(post.description, locale),
        content: getLocaleString(post.content, locale),
        author: getLocaleString(post.author, locale),
    };
}

export async function loadBlogPosts(locale: string = 'fi'): Promise<BlogPost[]> {
    const blogDir = path.join(process.cwd(), 'content', 'blog');

    try {
        const files = await fs.readdir(blogDir);
        const posts: BlogPost[] = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(blogDir, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const post = JSON.parse(fileContent) as BlogPost;
                posts.push(selectLocaleForPost(post, locale));
            }
        }

        return posts.sort(
            (a, b) =>
                new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
        );
    } catch {
        return [];
    }
}

export async function loadBlogPost(slug: string, locale: string = 'fi'): Promise<BlogPost | null> {
    const blogDir = path.join(process.cwd(), 'content', 'blog');
    const filePath = path.join(blogDir, `${slug}.json`);

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const post = JSON.parse(fileContent) as BlogPost;
        return selectLocaleForPost(post, locale);
    } catch {
        return null;
    }
}

