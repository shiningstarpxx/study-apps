import { createRepositoryContract } from '../../../shared/lib/repository/createRepositoryContract';

export const REQUIRED_CATALOG_REPOSITORY_METHODS = [
  'getEpisodes',
  'getEpisodeCatalog',
  'getAllScenes',
  'getAllKeywords',
  'getSceneById',
  'getEpisodeById',
  'getScenesByDifficulty',
  'getScenesByTag',
  'getTagCategories',
  'getDifficultyLevels',
];

export function createCatalogRepository(repository) {
  return createRepositoryContract('catalogRepository', repository, REQUIRED_CATALOG_REPOSITORY_METHODS);
}
