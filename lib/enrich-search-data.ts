import { readFile } from 'fs/promises';
import path from 'path';

type SearchDocument = {
    id: string;
    content: Record<string, unknown>;
    metadata?: Record<string, unknown>;
};

type Translations = {
    fields: Record<string, { fi: string; en: string; sv: string }>;
    colors: Record<string, { fi: string; en: string; sv: string }>;
    universities: Record<string, { fi: string; en: string; sv: string }>;
    areas: Record<string, { fi: string; en: string; sv: string }>;
};

let translationsCache: Translations | null = null;

async function loadTranslations(): Promise<Translations> {
    if (translationsCache) {
        return translationsCache;
    }

    const filePath = path.join(process.cwd(), 'data', 'translations.json');
    const fileContents = await readFile(filePath, 'utf-8');
    translationsCache = JSON.parse(fileContents) as Translations;
    return translationsCache;
}

export async function enrichDocumentWithTranslations(
    doc: SearchDocument
): Promise<SearchDocument> {
    const translations = await loadTranslations();
    const content = doc.content;

    const vari = (content.vari as string) || '';
    const alue = (content.alue as string) || '';
    const ala = (content.ala as string) || null;
    const oppilaitos = (content.oppilaitos as string) || '';

    const enrichedContent: Record<string, unknown> = {
        ...content,
    };

    if (vari) {
        const colorTrans = translations.colors[vari];
        enrichedContent.vari = {
            fi: vari,
            en: colorTrans?.en || vari,
            sv: colorTrans?.sv || vari,
        };
    }

    if (alue) {
        const areaTrans = translations.areas[alue];
        enrichedContent.alue = {
            fi: alue,
            en: areaTrans?.en || alue,
            sv: areaTrans?.sv || alue,
        };
    }

    if (oppilaitos) {
        const universityTrans = translations.universities[oppilaitos];
        enrichedContent.oppilaitos = {
            fi: oppilaitos,
            en: universityTrans?.en || oppilaitos,
            sv: universityTrans?.sv || oppilaitos,
        };
    }

    if (ala) {
        const fields = ala.split(', ').map(f => f.trim());
        const fieldsEn: string[] = [];
        const fieldsSv: string[] = [];

        for (const field of fields) {
            const fieldTrans = translations.fields[field];
            fieldsEn.push(fieldTrans?.en || field);
            fieldsSv.push(fieldTrans?.sv || field);
        }

        enrichedContent.ala = {
            fi: ala,
            en: fieldsEn.join(', '),
            sv: fieldsSv.join(', '),
        };
    }

    return {
        ...doc,
        content: enrichedContent,
    };
}

