// Starter flower list a new shop can begin with (chosen at sign-up).
// Photos live in a shared Cloudinary folder; shops never delete them (see
// destroyImage), so changing or removing one only affects that shop.

/** Shared photos. Never deleted on behalf of a shop. */
export const CATALOGUE_FOLDER = "petal/catalogue/";

export type CatalogueFlower = { name: string; photoUrl: string | null; photoPublicId: string | null };

export const CATALOGUE: CatalogueFlower[] = [
  { name: "Alstroemeria", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055945/petal/catalogue/alstroemeria.jpg", photoPublicId: "petal/catalogue/alstroemeria" },
  { name: "Anemone", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055945/petal/catalogue/anemone.jpg", photoPublicId: "petal/catalogue/anemone" },
  { name: "Carnation", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055946/petal/catalogue/carnation.jpg", photoPublicId: "petal/catalogue/carnation" },
  { name: "Chrysanthemum", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055947/petal/catalogue/chrysanthemum.jpg", photoPublicId: "petal/catalogue/chrysanthemum" },
  { name: "Dahlia", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055947/petal/catalogue/dahlia.jpg", photoPublicId: "petal/catalogue/dahlia" },
  { name: "Delphinium", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055948/petal/catalogue/delphinium.jpg", photoPublicId: "petal/catalogue/delphinium" },
  { name: "Eucalyptus", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055949/petal/catalogue/eucalyptus.jpg", photoPublicId: "petal/catalogue/eucalyptus" },
  { name: "Freesia", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055950/petal/catalogue/freesia.jpg", photoPublicId: "petal/catalogue/freesia" },
  { name: "Gerbera", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055951/petal/catalogue/gerbera.jpg", photoPublicId: "petal/catalogue/gerbera" },
  { name: "Gypsophila", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055951/petal/catalogue/gypsophila.jpg", photoPublicId: "petal/catalogue/gypsophila" },
  { name: "Hydrangea", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055952/petal/catalogue/hydrangea.jpg", photoPublicId: "petal/catalogue/hydrangea" },
  { name: "Lily (Oriental)", photoUrl: null, photoPublicId: null },
  { name: "Lisianthus", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055953/petal/catalogue/lisianthus.jpg", photoPublicId: "petal/catalogue/lisianthus" },
  { name: "Peony", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055954/petal/catalogue/peony.jpg", photoPublicId: "petal/catalogue/peony" },
  { name: "Ranunculus", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055954/petal/catalogue/ranunculus.jpg", photoPublicId: "petal/catalogue/ranunculus" },
  { name: "Rose (red)", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055955/petal/catalogue/rose-red.jpg", photoPublicId: "petal/catalogue/rose-red" },
  { name: "Rose (white)", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055956/petal/catalogue/rose-white.jpg", photoPublicId: "petal/catalogue/rose-white" },
  { name: "Snapdragon", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055956/petal/catalogue/snapdragon.jpg", photoPublicId: "petal/catalogue/snapdragon" },
  { name: "Stock", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055957/petal/catalogue/stock.jpg", photoPublicId: "petal/catalogue/stock" },
  { name: "Sunflower", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055958/petal/catalogue/sunflower.jpg", photoPublicId: "petal/catalogue/sunflower" },
  { name: "Tulip", photoUrl: "https://res.cloudinary.com/xciteenb/image/upload/v1791055959/petal/catalogue/tulip.jpg", photoPublicId: "petal/catalogue/tulip" },
];
