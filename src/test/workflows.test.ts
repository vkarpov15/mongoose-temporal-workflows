import { WorkflowClient, WorkflowHandle } from '@temporalio/client';
import { Core, Worker, DefaultLogger } from '@temporalio/worker';
import { describe, before, after, afterEach, it } from 'mocha';
import assert from 'assert';
import axios from 'axios';
import dedent from 'dedent';
import sinon from 'sinon';
import { generateSponsors, querySponsors } from '../workflows';
import * as activities from '../activities';

const taskQueue = 'test' + (new Date()).toLocaleDateString('en-US');

describe('generateSponsors workflow', function() {
  let runPromise: Promise<void>;
  let worker: Worker;
  let handle: WorkflowHandle<typeof generateSponsors>;
  let client: WorkflowClient;

  before(async function() {
    this.timeout(10000);

    // Suppress default log output to avoid logger polluting test output
    await Core.install({ logger: new DefaultLogger('ERROR') });

    worker = await Worker.create({
      workflowsPath: require.resolve('../workflows'),
      activities,
      taskQueue
    });

    runPromise = worker.run();
  });

  beforeEach(function() {
    client = new WorkflowClient();
  });

  afterEach(async function() {
    sinon.restore();
    await handle.terminate();
  });

  after(async function() {
    worker.shutdown();
    await runPromise;
  });

  it('handles successful response', async function() {    
    const stub = sinon.stub(axios, 'get').callsFake(() => Promise.resolve({
      data: [
        {
          "MemberId": 11423,
          "createdAt": "2018-01-13 00:17",
          "type": "USER",
          "role": "ADMIN",
          "isActive": true,
          "image": "https://avatars.githubusercontent.com/vkarpov15",
          "website": "https://thecodebarbarian.com"
        },
        {
          "MemberId": 11424,
          "createdAt": "2018-01-13 00:17",
          "type": "ORGANIZATION",
          "role": "HOST",
          "isActive": true,
          "image": "https://opencollective-production.s3.us-west-1.amazonaws.com/97017710-a90f-11e9-b6fb-2bbe7128f780.png",
          "website": "https://oscollective.org"
        },
        {
          "MemberId": 11551,
          "createdAt": "2018-01-16 19:54",
          "type": "ORGANIZATION",
          "role": "BACKER",
          "tier": "sponsor",
          "isActive": false,
          "image": "https://opencollective-production.s3-us-west-1.amazonaws.com/fcf6c0d0-f730-11e7-af8c-05ca2e1ddbda.png",
          "website": "https://mixmax.com"
        },
        {
          "MemberId": 13137,
          "createdAt": "2018-02-24 20:47",
          "type": "ORGANIZATION",
          "role": "BACKER",
          "tier": "backer",
          "isActive": false,
          "image": "https://opencollective-production.s3-us-west-1.amazonaws.com/308498c0-19a3-11e8-8343-278614155b3e.png",
          "website": "https://usehenri.io"
        },
        {
          "MemberId": 13281,
          "createdAt": "2018-02-27 22:57",
          "type": "ORGANIZATION",
          "role": "BACKER",
          "tier": "sponsor",
          "isActive": true,
          "image": "https://opencollective-production.s3.us-west-1.amazonaws.com/bf92e080-26a7-11eb-9bd1-97e665135c29.png",
          "website": "https://localizejs.com"
        }
      ]
    }));

    handle = await client.start(generateSponsors, {
      taskQueue,
      workflowId: 'test' + Date.now()
    });

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (stub.getCalls().length > 0) {
        break;
      }
    }

    const result = await handle.query(querySponsors);
    assert.equal(result, dedent(`
    <a rel="sponsored" href="https://localizejs.com">
      <img class="sponsor" src="https://opencollective-production.s3.us-west-1.amazonaws.com/bf92e080-26a7-11eb-9bd1-97e665135c29.png" style="height:100px" />
    </a>
    `));
  });
});