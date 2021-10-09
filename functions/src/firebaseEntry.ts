import * as functions from 'firebase-functions';
import * as http from 'http';
import Fastify, { FastifyInstance } from 'fastify';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

let handleRequest = null;

const serverFactory = (handler, opts) => {
  handleRequest = handler;
  return http.createServer();
};

const fastify = Fastify({ serverFactory });

let app;
async function createFunction(fastifyInstance: FastifyInstance) {
  app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(fastifyInstance),
  );

  await app.init();
}

export const api = functions
  .runWith({ timeoutSeconds: 10, memory: '128MB' }) // minInstances help with cold start but have a minimum cost
  .region('asia-southeast1')
  .https.onRequest(async (req, res) => {
    if (!app) {
      await createFunction(fastify);
    }

    fastify.ready((err) => {
      if (err) throw err;
      handleRequest(req, res);
    });
  });
