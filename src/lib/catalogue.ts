// Petal's flower list. On the Welcome page a new shop can pick from it
// instead of typing its flowers in. Photos live in a shared Cloudinary folder;
// shops never delete them (see destroyImage), so changing or removing one only
// affects that shop.

/** Shared photos. Never deleted on behalf of a shop. */
export const CATALOGUE_FOLDER = "petal/catalogue/";

export const CATALOGUE_GROUPS = ["Flowers", "Foliage & fillers"] as const;
export type CatalogueGroup = (typeof CATALOGUE_GROUPS)[number];

export type CatalogueFlower = {
  name: string;
  group: CatalogueGroup;
  photoUrl: string | null;
  photoPublicId: string | null;
};

export const CATALOGUE: CatalogueFlower[] = [
  { name: "Agapanthus", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Allium", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Alstroemeria", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055945/petal/catalogue/alstroemeria.jpg", photoPublicId: "petal/catalogue/alstroemeria" },
  { name: "Amaranthus", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Anemone", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055945/petal/catalogue/anemone.jpg", photoPublicId: "petal/catalogue/anemone" },
  { name: "Anthurium", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Aster", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Astilbe", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Bells of Ireland", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Bird of paradise", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Bouvardia", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Calla lily", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Carnation", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055946/petal/catalogue/carnation.jpg", photoPublicId: "petal/catalogue/carnation" },
  { name: "Carnation (spray)", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Chrysanthemum", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055947/petal/catalogue/chrysanthemum.jpg", photoPublicId: "petal/catalogue/chrysanthemum" },
  { name: "Chrysanthemum (spray)", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Cornflower", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Cosmos", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Craspedia", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Cymbidium orchid", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Daffodil", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Dahlia", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055947/petal/catalogue/dahlia.jpg", photoPublicId: "petal/catalogue/dahlia" },
  { name: "Delphinium", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055948/petal/catalogue/delphinium.jpg", photoPublicId: "petal/catalogue/delphinium" },
  { name: "Dianthus", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Eryngium", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Freesia", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055950/petal/catalogue/freesia.jpg", photoPublicId: "petal/catalogue/freesia" },
  { name: "Garden rose", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Gerbera", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055951/petal/catalogue/gerbera.jpg", photoPublicId: "petal/catalogue/gerbera" },
  { name: "Gladiolus", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Hellebore", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Hyacinth", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Hydrangea", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055952/petal/catalogue/hydrangea.jpg", photoPublicId: "petal/catalogue/hydrangea" },
  { name: "Iris", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Larkspur", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Lavender", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Leucadendron", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Lilac", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Lily (Asiatic)", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Lily (Oriental)", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Lisianthus", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055953/petal/catalogue/lisianthus.jpg", photoPublicId: "petal/catalogue/lisianthus" },
  { name: "Matricaria", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Mimosa", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Muscari", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Nerine", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Ornithogalum", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Peony", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055954/petal/catalogue/peony.jpg", photoPublicId: "petal/catalogue/peony" },
  { name: "Phalaenopsis orchid", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Protea", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Ranunculus", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055954/petal/catalogue/ranunculus.jpg", photoPublicId: "petal/catalogue/ranunculus" },
  { name: "Rose (orange)", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Rose (pink)", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Rose (red)", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055955/petal/catalogue/rose-red.jpg", photoPublicId: "petal/catalogue/rose-red" },
  { name: "Rose (white)", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055956/petal/catalogue/rose-white.jpg", photoPublicId: "petal/catalogue/rose-white" },
  { name: "Rose (yellow)", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Scabiosa", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Snapdragon", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055956/petal/catalogue/snapdragon.jpg", photoPublicId: "petal/catalogue/snapdragon" },
  { name: "Spray rose", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Statice", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Stock", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055957/petal/catalogue/stock.jpg", photoPublicId: "petal/catalogue/stock" },
  { name: "Sunflower", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055958/petal/catalogue/sunflower.jpg", photoPublicId: "petal/catalogue/sunflower" },
  { name: "Sweet pea", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Sweet William", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Tulip", group: "Flowers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055959/petal/catalogue/tulip.jpg", photoPublicId: "petal/catalogue/tulip" },
  { name: "Veronica", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Zinnia", group: "Flowers", photoUrl: null, photoPublicId: null },
  { name: "Asparagus fern", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Eucalyptus", group: "Foliage & fillers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055949/petal/catalogue/eucalyptus.jpg", photoPublicId: "petal/catalogue/eucalyptus" },
  { name: "Gypsophila", group: "Foliage & fillers", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055951/petal/catalogue/gypsophila.jpg", photoPublicId: "petal/catalogue/gypsophila" },
  { name: "Hypericum", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Ivy", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Leatherleaf fern", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Lunaria", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Monstera leaf", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Pampas grass", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Pistacia", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Pittosporum", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Ruscus", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Salal", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Solidago", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
  { name: "Wax flower", group: "Foliage & fillers", photoUrl: null, photoPublicId: null },
];
