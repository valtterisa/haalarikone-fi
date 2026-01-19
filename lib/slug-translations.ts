import { generateSlug } from './generate-slug';

export type Locale = 'fi' | 'en' | 'sv';

type EntityTranslations = {
    fi: string;
    en: string;
    sv: string;
};

const fieldTranslations: Record<string, EntityTranslations> = {
    'matematiikka': { fi: 'matematiikka', en: 'mathematics', sv: 'matematik' },
    'fysiikka': { fi: 'fysiikka', en: 'physics', sv: 'fysik' },
    'kemia': { fi: 'kemia', en: 'chemistry', sv: 'kemi' },
    'tietotekniikka': { fi: 'tietotekniikka', en: 'computer science', sv: 'datavetenskap' },
    'lääketiede': { fi: 'lääketiede', en: 'medicine', sv: 'medicin' },
    'oikeustiede': { fi: 'oikeustiede', en: 'law', sv: 'rättsvetenskap' },
    'kauppatiede': { fi: 'kauppatiede', en: 'business', sv: 'handel' },
    'psykologia': { fi: 'psykologia', en: 'psychology', sv: 'psykologi' },
    'sosiologia': { fi: 'sosiologia', en: 'sociology', sv: 'sociologi' },
    'historia': { fi: 'historia', en: 'history', sv: 'historia' },
    'filosofia': { fi: 'filosofia', en: 'philosophy', sv: 'filosofi' },
    'kielitiede': { fi: 'kielitiede', en: 'linguistics', sv: 'lingvistik' },
    'taide': { fi: 'taide', en: 'arts', sv: 'konst' },
    'arkkitehtuuri': { fi: 'arkkitehtuuri', en: 'architecture', sv: 'arkitektur' },
    'insinööritiede': { fi: 'insinööritiede', en: 'engineering', sv: 'teknik' },
    'maatalous': { fi: 'maatalous', en: 'agriculture', sv: 'jordbruk' },
    'metsätiede': { fi: 'metsätiede', en: 'forestry', sv: 'skogsvetenskap' },
    'eläinlääketiede': { fi: 'eläinlääketiede', en: 'veterinary medicine', sv: 'veterinärmedicin' },
    'kasvatustiede': { fi: 'kasvatustiede', en: 'education', sv: 'pedagogik' },
};

const colorTranslations: Record<string, EntityTranslations> = {
    'sininen': { fi: 'sininen', en: 'blue', sv: 'blå' },
    'punainen': { fi: 'punainen', en: 'red', sv: 'röd' },
    'vihreä': { fi: 'vihreä', en: 'green', sv: 'grön' },
    'keltainen': { fi: 'keltainen', en: 'yellow', sv: 'gul' },
    'oranssi': { fi: 'oranssi', en: 'orange', sv: 'orange' },
    'violetti': { fi: 'violetti', en: 'violet', sv: 'violett' },
    'musta': { fi: 'musta', en: 'black', sv: 'svart' },
    'valkoinen': { fi: 'valkoinen', en: 'white', sv: 'vit' },
    'harmaa': { fi: 'harmaa', en: 'gray', sv: 'grå' },
    'ruskea': { fi: 'ruskea', en: 'brown', sv: 'brun' },
    'pinkki': { fi: 'pinkki', en: 'pink', sv: 'rosa' },
    'turkoosi': { fi: 'turkoosi', en: 'turquoise', sv: 'turkos' },
    'beige': { fi: 'beige', en: 'beige', sv: 'beige' },
    'lila': { fi: 'lila', en: 'lilac', sv: 'lila' },
};

const universityTranslations: Record<string, EntityTranslations> = {
    'Helsingin yliopisto': { fi: 'Helsingin yliopisto', en: 'University of Helsinki', sv: 'Helsingfors universitet' },
    'Aalto-yliopisto': { fi: 'Aalto-yliopisto', en: 'Aalto University', sv: 'Aalto-universitetet' },
    'Tampere yliopisto': { fi: 'Tampere yliopisto', en: 'Tampere University', sv: 'Tammerfors universitet' },
    'Turun yliopisto': { fi: 'Turun yliopisto', en: 'University of Turku', sv: 'Åbo universitet' },
    'Oulun yliopisto': { fi: 'Oulun yliopisto', en: 'University of Oulu', sv: 'Uleåborgs universitet' },
    'Jyväskylän yliopisto': { fi: 'Jyväskylän yliopisto', en: 'University of Jyväskylä', sv: 'Jyväskylä universitet' },
    'Itä-Suomen yliopisto': { fi: 'Itä-Suomen yliopisto', en: 'University of Eastern Finland', sv: 'Östra Finlands universitet' },
    'Lapin yliopisto': { fi: 'Lapin yliopisto', en: 'University of Lapland', sv: 'Lapplands universitet' },
    'LUT-yliopisto': { fi: 'LUT-yliopisto', en: 'LUT University', sv: 'LUT-universitetet' },
    'Åbo Akademi': { fi: 'Åbo Akademi', en: 'Åbo Akademi University', sv: 'Åbo Akademi' },
    'Hanken': { fi: 'Hanken', en: 'Hanken School of Economics', sv: 'Hanken' },
    'Taideyliopisto': { fi: 'Taideyliopisto', en: 'University of the Arts Helsinki', sv: 'Konstuniversitetet' },
    'Maanpuolustuskorkeakoulu': { fi: 'Maanpuolustuskorkeakoulu', en: 'National Defence University', sv: 'Försvarshögskolan' },
};

const areaTranslations: Record<string, EntityTranslations> = {
    'Helsinki': { fi: 'Helsinki', en: 'Helsinki', sv: 'Helsingfors' },
    'Tampere': { fi: 'Tampere', en: 'Tampere', sv: 'Tammerfors' },
    'Turku': { fi: 'Turku', en: 'Turku', sv: 'Åbo' },
    'Oulu': { fi: 'Oulu', en: 'Oulu', sv: 'Uleåborg' },
    'Jyväskylä': { fi: 'Jyväskylä', en: 'Jyväskylä', sv: 'Jyväskylä' },
    'Espoo': { fi: 'Espoo', en: 'Espoo', sv: 'Esbo' },
    'Vantaa': { fi: 'Vantaa', en: 'Vantaa', sv: 'Vanda' },
    'Lahti': { fi: 'Lahti', en: 'Lahti', sv: 'Lahtis' },
    'Kuopio': { fi: 'Kuopio', en: 'Kuopio', sv: 'Kuopio' },
    'Pori': { fi: 'Pori', en: 'Pori', sv: 'Björneborg' },
    'Joensuu': { fi: 'Joensuu', en: 'Joensuu', sv: 'Joensuu' },
    'Lappeenranta': { fi: 'Lappeenranta', en: 'Lappeenranta', sv: 'Villmanstrand' },
    'Vaasa': { fi: 'Vaasa', en: 'Vaasa', sv: 'Vasa' },
    'Rovaniemi': { fi: 'Rovaniemi', en: 'Rovaniemi', sv: 'Rovaniemi' },
};

export function getEntityTranslation(
    entity: string,
    locale: Locale,
    type: 'field' | 'color' | 'university' | 'area'
): string {
    const translations =
        type === 'field' ? fieldTranslations :
            type === 'color' ? colorTranslations :
                type === 'university' ? universityTranslations :
                    areaTranslations;

    return translations[entity]?.[locale] || entity;
}

export function getSlugForEntity(
    entity: string,
    locale: Locale,
    type: 'field' | 'color' | 'university' | 'area'
): string {
    const translated = getEntityTranslation(entity, locale, type);
    return generateSlug(translated);
}

export function getEntityFromSlug(
    slug: string,
    locale: Locale,
    type: 'field' | 'color' | 'university' | 'area',
    allEntities: string[]
): string | null {
    const translations =
        type === 'field' ? fieldTranslations :
            type === 'color' ? colorTranslations :
                type === 'university' ? universityTranslations :
                    areaTranslations;

    for (const [canonicalEntity, trans] of Object.entries(translations)) {
        const translatedEntity = trans[locale] || canonicalEntity;
        if (generateSlug(translatedEntity) === slug) {
            return canonicalEntity;
        }
    }

    for (const entity of allEntities) {
        if (generateSlug(entity) === slug) {
            return entity;
        }
    }

    return null;
}

export function getCanonicalSlug(
    entity: string,
    type: 'field' | 'color' | 'university' | 'area'
): string {
    return generateSlug(entity);
}

