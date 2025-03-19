import { RecursiveUrlLoader } from '@langchain/community/document_loaders/web/recursive_url';
import { PuppeteerWebBaseLoader } from '@langchain/community/document_loaders/web/puppeteer';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { compile } from 'html-to-text';
import * as fs from 'fs';
import * as path from 'path';
import { OnApplicationBootstrap, Injectable } from '@nestjs/common';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
@Injectable()
export class Crawl implements OnApplicationBootstrap {
  async crawlOnePage(url: string) {
    const loader = new PuppeteerWebBaseLoader(url);
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 10000,
      chunkOverlap: 1000,
    });
    const docOutput = await splitter.splitDocuments(docs);
    console.log('docs: ', docOutput);
    return docOutput;
  }

  async crawlChildLink(url: string) {
    const compiledConvert = compile({ wordwrap: 130 });
    const loader = new RecursiveUrlLoader(url, {
      extractor: compiledConvert,
      maxDepth: 4,
    });
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 10000,
      chunkOverlap: 1000,
    });
    const docOutput = await splitter.splitDocuments(docs);
    console.log('docs: ', docOutput);
    return docOutput;
  }

  async saveData(data: any) {
    const dataDir = path.join(process.cwd(), 'src/milvus-db/data');
    console.log('dt', __dirname);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    const filePath = path.join(dataDir, 'whalesmarket.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Data saved to ${filePath}`);
  }

  async processTextData(textData: string) {
    const doc = new Document({
      pageContent: textData,
      metadata: {
        source: 'text_input',
        title: 'Manual Input',
        description: 'Manually input text data',
        language: 'en',
        doc_name: 'whales market',
      },
    });
    return [doc];
  }

  async fileTxt() {
    const dataDir = path.join(process.cwd(), 'pgvector-db/data');
    const filePath = path.join(dataDir, 'WMDatabase1.txt');
    const loader = new TextLoader(filePath);
    const docs = await loader.load();
    // const splitter = new RecursiveCharacterTextSplitter({
    //   chunkSize: 10000,
    //   chunkOverlap: 1000,
    // });
    // const docOutput = await splitter.splitDocuments(docs);
    console.log('docs: ', docs);
    return docs;
  }

  async filePdf() {
    const dataDir = path.join(process.cwd(), 'pgvector-db/data');
    const filePath = path.join(dataDir, 'whalesAI.pdf');
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    // console.log('docs: ', docs);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 500,
    });
    const docOutput = await splitter.splitDocuments(docs);
    console.log('docs: ', docOutput.length);
    return docOutput;
  }

  async processUploadedFile(
    file: Express.Multer.File,
    fileType: 'txt' | 'pdf',
  ) {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempFilePath = path.join(tempDir, file.originalname);
    fs.writeFileSync(tempFilePath, file.buffer);

    try {
      let docs;
      if (fileType === 'txt') {
        const loader = new TextLoader(tempFilePath);
        docs = await loader.load();
      } else if (fileType === 'pdf') {
        const loader = new PDFLoader(tempFilePath);
        docs = await loader.load();
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 2000,
          chunkOverlap: 500,
        });
        docs = await splitter.splitDocuments(docs);
      }
      // fs.unlinkSync(tempFilePath);

      //get path file temp
      return {
        docs,
        tempFilePath: tempFilePath,
      };
    } catch (error) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  }

  async onApplicationBootstrap() {
    // const data = await this.crawlChildLink('https://docs.whales.market/');
    // await this.saveData(data);
    // const data = await this.fileData();
    // console.log('data: ', data);
    // const data = await this.filePdf();
    // console.log('data: ', data);
    // const tempDir = path.join(path.dirname(__dirname), 'temp');
    // console.log('tempDir: ', tempDir);
  }
}
