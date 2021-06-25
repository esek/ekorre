import axios from 'axios';
import { parseStringPromise } from 'xml2js';

import config from '../config';

type CasResponse = {
  'cas:serviceResponse': {
    'cas:authenticationFailure': CasResponseError[];
    'cas:authenticationSuccess'?: CasResponseSuccess[];
  };
};

type CasResponseError = {
  $: {
    code: string;
  };
};

type CasResponseSuccess = {
  'cas:user': string[];
};

export const validateCasTicket = async (ticket: string): Promise<string> =>
  new Promise((resolve, reject) => {
    (async () => {
      // Callback URL that LU uses to send the ticket back
      const CB_URL = `${config.EKOLLON}/register/member`;

      const LU_URL = `https://idpv3.lu.se/idp/profile/cas/serviceValidate?renew=false&service=${encodeURI(
        CB_URL,
      )}&ticket=${ticket}`;

      // Fetch XML data from LU
      const xml = await axios.get<string>(LU_URL).then((res) => res.data);

      if (!xml) {
        reject('CAS_LU_UNAVAILABLE');
        return;
      }

      const response = (await parseStringPromise(xml).catch(() =>
        reject('CAS_PARSE_ERROR'),
      )) as CasResponse;

      // Get errors from LU Response
      const errors = response['cas:serviceResponse']['cas:authenticationFailure'];

      // IF any, parse them and reject them to send as error in apollo
      if (errors || !response['cas:serviceResponse']['cas:authenticationSuccess']) {
        reject(parseCasError(errors));
        return;
      }

      const username: string =
        response['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:user'][0];

      resolve(username);
    })();
  });

const parseCasError = (errors: CasResponseError[]) => {
  const errorString = errors.map((e) => `CAS_${e.$.code}`);
  return errorString;
};
