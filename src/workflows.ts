import { proxyActivities, defineQuery, setHandler, sleep } from '@temporalio/workflow';
import dedent from 'dedent';

// Only import the activity types
import type * as activities from './activities'

const { getSponsorsList } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 1
  }
});

export const querySponsors = defineQuery<string>('querySponsors');

export async function generateSponsors(): Promise<any> {
  let sponsors = '';
  setHandler(querySponsors, () => sponsors);
  while (true) {
    const list = [];
    const result = await getSponsorsList();
    for(let i = 0; i < result.length; i++) {
      if(result[i].tier == 'sponsor' && result[i].isActive) {
        list.push(dedent(`
        <a rel="sponsored" href="${result[i].website}">
        <img class="sponsor" src="${result[i].image}" style="height:100px" />
        </a>
        `));
      }
    }

    sponsors = list.join('\n');
    await sleep('1d');
  }
}