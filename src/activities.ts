import axios from 'axios';

export async function getSponsorsList(): Promise<any> {
  const result = await axios.get('https://opencollective.com/mongoose/members.json');
  console.log('Got', result);
  return result.data;
}