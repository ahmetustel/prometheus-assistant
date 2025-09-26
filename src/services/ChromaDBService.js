import { ChromaClient } from 'chromadb';
import fs from 'fs-extra';
import crypto from 'crypto';

export class ChromaDBService {
  constructor(host = 'http://localhost:8000') {
    this.host = host;
    this.client = null;
    this.collections = new Map();
    this.initializeClient();
  }

  async initializeClient() {
    try {
      this.client = new ChromaClient({
        path: this.host
      });
      console.log('ChromaDB client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ChromaDB client:', error.message);
    }
  }

  /**
   * Initialize or get collection for a project
   */
  async getOrCreateCollection(projectName) {
    if (!this.client) {
      await this.initializeClient();
    }

    const collectionName = this.sanitizeCollectionName(projectName);

    if (this.collections.has(collectionName)) {
      return this.collections.get(collectionName);
    }

    try {
      // Try to get existing collection first
      const collection = await this.client.getCollection({
        name: collectionName
      });

      this.collections.set(collectionName, collection);
      return collection;
    } catch (error) {
      // Collection doesn't exist, create it
      try {
        const collection = await this.client.createCollection({
          name: collectionName,
          metadata: {
            project: projectName,
            created: new Date().toISOString(),
            description: `Code and documentation chunks for ${projectName}`
          }
        });

        this.collections.set(collectionName, collection);
        return collection;
      } catch (createError) {
        console.error(`Failed to create collection ${collectionName}:`, createError);
        throw createError;
      }
    }
  }

  /**
   * Add code chunks to ChromaDB
   */
  async addCodeChunks(projectName, chunks) {
    const collection = await this.getOrCreateCollection(projectName);

    if (!chunks || chunks.length === 0) {
      return;
    }

    const documents = chunks.map(chunk => chunk.content);
    const metadatas = chunks.map(chunk => ({
      file_path: chunk.filePath,
      chunk_type: chunk.type || 'code',
      language: chunk.language || 'unknown',
      start_line: chunk.startLine || 0,
      end_line: chunk.endLine || 0,
      size: chunk.content.length,
      hash: this.generateHash(chunk.content)
    }));
    const ids = chunks.map((chunk, index) =>
      `${projectName}_${this.generateHash(chunk.filePath + chunk.content)}_${index}`
    );

    try {
      await collection.add({
        documents,
        metadatas,
        ids
      });

      console.log(`Added ${chunks.length} chunks to ChromaDB for project ${projectName}`);
    } catch (error) {
      console.error(`Failed to add chunks to ChromaDB:`, error);
      throw error;
    }
  }

  /**
   * Search for similar code chunks
   */
  async searchSimilar(projectName, query, nResults = 10) {
    try {
      const collection = await this.getOrCreateCollection(projectName);

      const results = await collection.query({
        queryTexts: [query],
        nResults,
        include: ['documents', 'metadatas', 'distances']
      });

      if (!results.documents || results.documents.length === 0) {
        return [];
      }

      // Format results
      const formattedResults = [];
      const documents = results.documents[0] || [];
      const metadatas = results.metadatas?.[0] || [];
      const distances = results.distances?.[0] || [];

      for (let i = 0; i < documents.length; i++) {
        formattedResults.push({
          content: documents[i],
          metadata: metadatas[i],
          similarity: 1 - (distances[i] || 0), // Convert distance to similarity
          filePath: metadatas[i]?.file_path,
          language: metadatas[i]?.language,
          chunkType: metadatas[i]?.chunk_type
        });
      }

      return formattedResults;
    } catch (error) {
      console.error(`Failed to search in ChromaDB:`, error);
      return [];
    }
  }

  /**
   * Delete all data for a project
   */
  async deleteProject(projectName) {
    try {
      const collectionName = this.sanitizeCollectionName(projectName);
      await this.client.deleteCollection({
        name: collectionName
      });

      this.collections.delete(collectionName);
      console.log(`Deleted ChromaDB collection for project ${projectName}`);
    } catch (error) {
      console.error(`Failed to delete collection:`, error);
    }
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(projectName) {
    try {
      const collection = await this.getOrCreateCollection(projectName);
      const count = await collection.count();

      return {
        name: collection.name,
        count: count || 0,
        metadata: collection.metadata
      };
    } catch (error) {
      console.error(`Failed to get collection stats:`, error);
      return null;
    }
  }

  /**
   * Test ChromaDB connection
   */
  async testConnection() {
    try {
      if (!this.client) {
        await this.initializeClient();
      }
      const version = await this.client.version();
      console.log(`ChromaDB connection successful. Version: ${version}`);
      return true;
    } catch (error) {
      console.error(`ChromaDB connection failed:`, error.message);
      return false;
    }
  }

  /**
   * Sanitize collection name for ChromaDB
   */
  sanitizeCollectionName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .substring(0, 63); // ChromaDB collection name limit
  }

  /**
   * Generate hash for content
   */
  generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Chunk text into smaller pieces for better embeddings
   */
  chunkText(text, maxChunkSize = 1500, overlap = 200) {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + maxChunkSize, text.length);

      // Try to break at a natural boundary (newline or space)
      if (end < text.length) {
        const newlineIndex = text.lastIndexOf('\n', end);
        const spaceIndex = text.lastIndexOf(' ', end);

        if (newlineIndex > start + maxChunkSize * 0.5) {
          end = newlineIndex;
        } else if (spaceIndex > start + maxChunkSize * 0.5) {
          end = spaceIndex;
        }
      }

      chunks.push(text.substring(start, end));
      start = Math.max(start + maxChunkSize - overlap, end - overlap);
    }

    return chunks;
  }
}