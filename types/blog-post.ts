type LocaleString = string | { fi: string; en?: string; sv?: string };

export type BlogPost = {
    slug: string;
    title: LocaleString;
    description: LocaleString;
    content: LocaleString;
    author: LocaleString;
    publishDate: string;
    readingTime?: number;
};

