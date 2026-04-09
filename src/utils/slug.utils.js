// Utilitaire pour générer des slugs
const genererSlug = (texte) => {
    return texte
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, ''); // Retirer les tirets au début et à la fin
};

// Générer un slug unique en ajoutant un suffixe si nécessaire
const genererSlugUnique = async (texte, model, id = null) => {
    let slug = genererSlug(texte);
    let slugFinal = slug;
    let compteur = 1;

    while (true) {
        const where = { slug: slugFinal };
        if (id) {
            where.id = { [require('sequelize').Op.ne]: id };
        }

        const existe = await model.findOne({ where });

        if (!existe) {
            return slugFinal;
        }

        slugFinal = `${slug}-${compteur}`;
        compteur++;
    }
};

module.exports = {
    genererSlug,
    genererSlugUnique
};
