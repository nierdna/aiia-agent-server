import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Inject } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { Crawl } from '../crawl/crawl';
import * as pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const EMBEDDING_MODEL_NAME = 'text-embedding-3-large';

@Injectable()
export class PgvectorRepository implements OnApplicationBootstrap {
  private reusablePool: pg.Pool;
  private originalConfig: any;
  private pgvectorStore: PGVectorStore;
  private tableName: string;
  @Inject(Crawl)
  private readonly crawl: Crawl;

  constructor() {
    // this.tableName = 'whales_market_table_4';
    console.log('process.env.DB_VECTOR_HOST: ', process.env.DB_VECTOR_HOST);
    console.log('process.env.DB_VECTOR_PORT: ', process.env.DB_VECTOR_PORT);
    console.log(
      'process.env.DB_VECTOR_USERNAME: ',
      process.env.DB_VECTOR_USERNAME,
    );
    console.log(
      'process.env.DB_VECTOR_PASSWORD: ',
      process.env.DB_VECTOR_PASSWORD,
    );
    console.log('process.env.DB_VECTOR_NAME: ', process.env.DB_VECTOR_NAME);
    this.reusablePool = new pg.Pool({
      host: process.env.DB_VECTOR_HOST || 'localhost',
      port: process.env.DB_VECTOR_PORT || 5433,
      user: process.env.DB_VECTOR_USERNAME || 'root',
      password: process.env.DB_VECTOR_PASSWORD || '123456',
      database: process.env.DB_VECTOR_NAME || 'cs_agent_vector_db',
    });
    console.log('reusablePool: ', this.reusablePool);
    this.originalConfig = {
      pool: this.reusablePool,
      tableName: this.tableName,
      collectionTableName: 'cs_agent_collection',
      collectionName: this.tableName,
      columns: {
        idColumnName: 'id',
        vectorColumnName: 'vector',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
      },
    };
  }

  async createPGVectorStore(tableName: string) {
    const config = {
      ...this.originalConfig,
      tableName: tableName,
      collectionName: tableName,
    };

    this.pgvectorStore = await PGVectorStore.initialize(
      new OpenAIEmbeddings({
        modelName: EMBEDDING_MODEL_NAME,
        openAIApiKey: process.env.OPEN_AI_API_KEY,
      }),
      config,
    );
  }

  async seedData(data: any, tableName: string) {
    const client = await this.reusablePool.connect();
    try {
      await client.query(`TRUNCATE TABLE ${tableName}`);
    } finally {
      client.release();
    }

    const documents = data.map((doc) => {
      return new Document({
        pageContent: doc.pageContent || '',
        metadata: {
          source: doc.metadata?.source || '',
          title: doc.metadata?.title || '',
          description: doc.metadata?.description || '',
          language: doc.metadata?.language || 'unknown',
          loc: JSON.stringify(doc.metadata?.loc) || '',
          doc_name: 'whales market',
        },
      });
    });

    const ids = Array.from({ length: data.length }, () => uuidv4());

    if (!this.pgvectorStore) {
      throw new Error('PGVector vector store not initialized.');
    }

    await this.pgvectorStore.addDocuments(documents, {
      ids: ids,
    });
  }

  async search(
    question: any,
    tableName: string = 'cs_agent_525ecaec-604c-4eb6-82a7-c5c565f3acf7',
  ) {
    try {
      const embeddings = new OpenAIEmbeddings({
        modelName: EMBEDDING_MODEL_NAME,
        openAIApiKey: process.env.OPEN_AI_API_KEY,
      });

      const vectorStore = await new PGVectorStore(embeddings, {
        pool: this.reusablePool,
        tableName: tableName,
        collectionTableName: 'cs_agent_collection',
        collectionName: tableName,
        columns: {
          idColumnName: 'id',
          vectorColumnName: 'vector',
          contentColumnName: 'content',
          metadataColumnName: 'metadata',
        },
      });

      const questionEmbedding = await embeddings.embedQuery(question);

      const results = await vectorStore.similaritySearchVectorWithScore(
        questionEmbedding,
        4,
      );
      return results.map(([doc, score]) => ({
        document: doc,
        score: score,
      }));
    } catch (error) {
      console.error('Error during search: ', error);
      throw new Error('Search failed, please try again.');
    }
  }

  async ensureExtension() {
    const client = await this.reusablePool.connect();
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    } finally {
      client.release();
    }
  }

  async deleteData(docname: string) {
    const embeddings = new OpenAIEmbeddings({
      modelName: EMBEDDING_MODEL_NAME,
      openAIApiKey: process.env.OPEN_AI_API_KEY,
    });

    const vectorStore = await new PGVectorStore(embeddings, {
      pool: this.reusablePool,
      tableName: 'whales_market_table_1',
      collectionTableName: 'cs_agent_collection',
      collectionName: 'whales_market_collection_1',
      columns: {
        idColumnName: 'id',
        vectorColumnName: 'vector',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
      },
    });

    await vectorStore.delete({ filter: { doc_name: docname } });
  }

  async onApplicationBootstrap() {
    // await this.ensureExtension();
    // await this.createPGVectorStore('whales_market_table_5');
    // const data = await this.crawl.filePdf();
    // await this.seedData(data);
    // console.log('seed data success');
    // await this.deleteData();
    // console.log('delete data success');
    
    // Initialize AIIA Finance documentation
    const aiiaTableName = 'cs_agent_aiia_finance';
    
    try {
      // Check if the table exists and has data
      const client = await this.reusablePool.connect();
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '${aiiaTableName}'
          )
        `);
        
        if (!result.rows[0].exists) {
          console.log(`Table ${aiiaTableName} does not exist. Creating and embedding AIIA Finance documentation...`);
          // await this.processAIIAFinanceDoc();
        } else {
          console.log(`Table ${aiiaTableName} already exists. AIIA Finance documentation is ready.`);
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error checking AIIA Finance documentation:', error);
    }
  }
  
  async processAIIAFinanceDoc() {
    try {
      console.log('Processing AIIA Finance documentation...');
      const filePath = path.join(process.cwd(), 'data/aiia/aiia_finance_docs.txt');
      
      if (!fs.existsSync(filePath)) {
        console.error('AIIA Finance documentation file not found');
        return;
      }
      
      const loader = new TextLoader(filePath);
      const docs = await loader.load();
      
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 500,
      });
      
      const docOutput = await splitter.splitDocuments(docs);
      
      // Update metadata for AIIA Finance
      const aiiaDocuments = docOutput.map(doc => {
        return new Document({
          pageContent: doc.pageContent,
          metadata: {
            source: 'aiia_finance_docs.txt',
            title: 'AIIA Finance Documentation',
            description: 'AIIA Finance DeFi platform documentation',
            language: 'en',
            doc_name: 'aiia finance',
            ...doc.metadata
          },
        });
      });
      
      // Create a dedicated table for AIIA Finance
      const tableName = 'cs_agent_aiia_finance';
      await this.createPGVectorStore(tableName);
      await this.seedData(aiiaDocuments, tableName);
      
      console.log(`Successfully processed and embedded AIIA Finance documentation into ${tableName}`);
    } catch (error) {
      console.error('Error processing AIIA Finance documentation:', error);
    }
  }
}
