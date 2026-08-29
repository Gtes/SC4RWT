/** One SC4 terrain cell / interval = 16 m × 16 m */
export const SC4_METERS_PER_CELL = 16

/** Large city tile terrain cells along one edge */
export const SC4_LARGE_CITY_CELLS = 256

/** Real-world extent of one large city tile */
export const SC4_LARGE_CITY_METERS =
  SC4_METERS_PER_CELL * SC4_LARGE_CITY_CELLS

/** SC4 internal sea level in meters */
export const SC4_SEA_LEVEL_METERS = 250

/** Height units per meter in exported 16-bit values */
export const SC4_HEIGHT_UNITS_PER_METER = 10

/** Ocean / nodata substitute (real-world meters) for V1 */
export const SC4_OCEAN_FLOOR_METERS = -50

/** Region sizes supported (large cities per side) */
export const SC4_SUPPORTED_REGION_SIZES = [1, 2, 4, 8] as const

export type Sc4RegionSize = (typeof SC4_SUPPORTED_REGION_SIZES)[number]
