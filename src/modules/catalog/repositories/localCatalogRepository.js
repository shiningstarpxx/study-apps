import {
  difficultyLevels,
  episodes,
  getAllKeywords,
  getAllScenes,
  getEpisodeCatalog,
  getScenesByDifficulty,
  getScenesByTag,
  tagCategories,
} from '../../../data/episodes';
import { createCatalogRepository } from './catalogRepository';

function getEpisodeById(episodeId) {
  return episodes.find((episode) => episode.id === episodeId) || null;
}

function getSceneById(sceneId) {
  return getAllScenes().find((scene) => scene.id === sceneId) || null;
}

export const localCatalogRepository = createCatalogRepository({
  getEpisodes: () => episodes,
  getEpisodeCatalog,
  getAllScenes,
  getAllKeywords,
  getSceneById,
  getEpisodeById,
  getScenesByDifficulty,
  getScenesByTag,
  getTagCategories: () => tagCategories,
  getDifficultyLevels: () => difficultyLevels,
});
