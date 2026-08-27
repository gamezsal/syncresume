/**
 * GraphQL v4 query templates for the syncresume GitHub Ingestion Pipeline.
 * 
 * We leverage GitHub's strongly-typed GraphQL schema to retrieve nested
 * file structures and repository metadata in a single network round-trip.
 * This maximizes rate-limiting "points" efficiency compared to REST.
 */

export const GET_REPO_METADATA = `
  query GetRepoMetadata($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      name
      description
      stargazerCount
      forkCount
      primaryLanguage {
        name
        color
      }
      pushedAt
      url
      defaultBranchRef {
        name
      }
    }
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
  }
`;

/**
 * Recursive multi-level directory tree extraction.
 * Fetches files up to 3 levels deep in a single request, which is highly cost-efficient
 * and maps out exactly where your custom code components reside.
 */
export const GET_REPO_FILE_TREE = `
  query GetRepoFileTree($owner: String!, $name: String!, $expression: String!) {
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        ... on Tree {
          entries {
            name
            type
            mode
            object {
              ... on Blob {
                byteSize
                isBinary
              }
              ... on Tree {
                entries {
                  name
                  type
                  mode
                  object {
                    ... on Blob {
                      byteSize
                      isBinary
                    }
                    ... on Tree {
                      entries {
                        name
                        type
                        mode
                        object {
                          ... on Blob {
                            byteSize
                            isBinary
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
  }
`;

/**
 * Fetches the raw text content and metadata of a specific file (like README.md)
 * using Git revision expressions (e.g. "HEAD:README.md").
 */
export const GET_FILE_CONTENT = `
  query GetFileContent($owner: String!, $name: String!, $expression: String!) {
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        ... on Blob {
          text
          byteSize
          isBinary
        }
      }
    }
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
  }
`;
