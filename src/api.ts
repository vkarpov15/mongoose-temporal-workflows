import express, { Application } from 'express';
import { Server } from 'http';
import { createExpressMiddleware } from 'temporal-rest';
import { Connection, WorkflowClient } from '@temporalio/client';
import * as workflows from './workflows';

const taskQueue = 'mongoose';

async function run(): Promise<void> {
  const app = express();

  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const temporalRouter = express.Router();

  temporalRouter.use('/workflows/generateSponsors', (_req, _res, next) => {
    next(new Error('Cannot create new instance of generateSponsors workflow via API'));
  });

  app.use(createExpressMiddleware(workflows, client, taskQueue, temporalRouter));

  await app.listen(3000);

  // Start a new Workflow with a known id. This Workflow should run forever, so
  // we just want to be able to query it via API.
  try {
    await client.start(workflows.generateSponsors, {
      taskQueue,
      workflowId: 'default'
    });
  } catch (err) {
    if (!(err instanceof Error && err.name === 'WorkflowExecutionAlreadyStartedError')) {
      throw err;
    }
  }

  console.log('App listening on port 3000');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});