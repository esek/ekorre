import config from '@/config';
import axios from 'axios';

const {
  VERIFY: { URL },
} = config;

export const verify = async (ssn: string, userVerified: boolean) => {
  const options = {
    method: 'POST',
    url: URL,
    headers: { 'content-type': 'application/json' },
    data: { ssn: ssn.length == 10 ? ssn : ssn.slice(2), alreadyVerified: userVerified }, //Case for both 10 and 12 digit ssn.
  };
  const data = await axios.request(options);

  return data.status === 200;
};
