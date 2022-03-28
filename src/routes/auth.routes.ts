import { COOKIES, EXPIRE_MINUTES, issueToken, verifyToken } from '@/auth';
import config from '@/config';
import { TokenType, TokenValue } from '@/models/auth';
import { UserAPI } from '@api/user';
import { CookieOptions, Router } from 'express';

const authRoute = Router();

const userAPI = new UserAPI();

const cookieOptions = (tokenType: TokenType): CookieOptions => {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: EXPIRE_MINUTES[tokenType] * 60 * 1000,
    domain: config.COOKIE.DOMAIN,
  };
};

/** Regular HTTP POST endpoint for refreshing tokens
 * Used instead of GQL due to URQL not supporting fetching the headers...
 */
authRoute.post('/refresh', (req, res) => {
  (async () => {
    const { cookies } = req as { cookies: Record<string, string> };

    try {
      const refreshToken = cookies[COOKIES.refreshToken];

      // Get username from refresh token
      const verified = verifyToken<TokenValue>(refreshToken, 'refreshToken');

      // Fetch user from db
      const user = await userAPI.getSingleUser(verified.username);

      if (!user) {
        // throw new UnauthorizedError('Ingen användare hittades');
        throw new Error();
      }

      // Create new tokens
      const newAccessToken = issueToken<TokenValue>({ username: user.username }, 'accessToken');
      const newRefreshToken = issueToken<TokenValue>({ username: user.username }, 'refreshToken');

      // Attach them
      res.cookie(COOKIES.accessToken, newAccessToken, cookieOptions('accessToken'));
      res.cookie(COOKIES.refreshToken, newRefreshToken, cookieOptions('refreshToken'));

      // Attach the cookie domain beging used in the frontend
      res.setHeader('X-E-Cookie-Domain', config.COOKIE.DOMAIN);

      return res.sendStatus(200);
    } catch (error) {
      return res.sendStatus(401);
    }
  })();
});

export default authRoute;
