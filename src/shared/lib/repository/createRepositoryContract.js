export function createRepositoryContract(repositoryName, repository, requiredMethods) {
  const missingMethods = requiredMethods.filter((methodName) => typeof repository?.[methodName] !== 'function');

  if (missingMethods.length > 0) {
    throw new Error(`${repositoryName} is missing required methods: ${missingMethods.join(', ')}`);
  }

  return Object.freeze(repository);
}
