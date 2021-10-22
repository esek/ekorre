import axios from 'axios';

import config from '../config';

const BASE_URL = `${config.LU.CAS}/idp/profile/cas/serviceValidate`;

export const validateCasTicket = async (
  ticket: string,
  referer: string,
): Promise<string | null> => {
  const params = new URLSearchParams();
  params.append('renew', 'false');
  params.append('service', referer);
  params.append('ticket', ticket);

  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const response = await axios.get<string>(url).then((res) => res.data);

    if (!response) {
      throw new Error();
    }

    const regex = /<cas:user>(.*?)<\/cas:user>/;

    const [, username] = RegExp(regex).exec(response) ?? [];

    return username;
  } catch {
    return null;
  }
};
