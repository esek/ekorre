import { NotFoundError, BadRequestError, ServerError } from '../errors/RequestErrors';
import { Logger } from '../logger';
import { DatabaseElection, DatabaseNomination, DatabaseProposal } from '../models/db/election';
import { validateNonEmptyArray } from '../services/validation.service';
import { ELECTION_TABLE, NOMINATION_TABLE, PROPOSAL_TABLE, ELECTABLE_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('ElectionAPI');

export class ElectionAPI {
  /**
   * @returns Senaste mötet som skapades`
   * @throws `NotFoundError`
   */
  async getLatestCreatedElection(): Promise<DatabaseElection> {
    const e = await knex<DatabaseElection>(ELECTION_TABLE)
      .select('*')
      .orderBy('createdAt', 'desc')
      .first();

    if (e == null) {
      throw new NotFoundError('Hittade inga val');
    }

    return e;
  }

  /**
   * @returns Senaste mötet markerat som `open`
   * @throws `NotFoundError`
   */
  async getOpenElection(): Promise<DatabaseElection> {
    const e = await knex<DatabaseElection>(ELECTION_TABLE)
      .where('open', true)
      .orderBy('createdAt', 'desc')
      .first();

    if (e == null) {
      throw new NotFoundError('Hittade inga öppna möten');
    }

    return e;
  }

  /**
   * Returnerar alla nomineringar för posten och valet.
   * @param electionId ID på ett val
   * @param postname Namnet på posten
   * @returns Lista över nomineringar
   * @throws `NotFoundError`
   */
  async getNominations(electionId: string, postname: string): Promise<DatabaseNomination[]> {
    const n = await knex<DatabaseNomination>(NOMINATION_TABLE)
      .where('refelection', electionId)
      .where('refpost', postname);

    validateNonEmptyArray(n, `Hittade inga nomineringar för mötet med ID ${electionId}`);

    return n;
  }

  /**
   * Returnerar nomineringar för en användare.
   * @param electionId ID på ett val
   * @param username Användarnamnet
   * @returns Lista över nomineringar
   * @throws `NotFoundError`
   */
  async getNominationsForUser(electionId: string, username: string): Promise<DatabaseNomination[]> {
    const n = await knex<DatabaseNomination>(NOMINATION_TABLE)
      .where('refelection', electionId)
      .where('refuser', username);

    validateNonEmptyArray(n, `Hittade inga nomineringar för användaren ${username}`);

    return n;
  }

  /**
   * Räknar antalet nomineringar för en post och ett möte.
   * @param electionId ID på ett val
   * @param postname Namnet på posten
   * @returns Ett heltal (`number`)
   */
  async getNumberOfNominations(electionId: string, postname: string): Promise<number> {
    const i = await knex(NOMINATION_TABLE)
      .where('refelection', electionId)
      .where('refpost', postname)
      .count<Record<string, number>>('*')
      .first();

    if (i == null || i.count == null) {
      logger.debug(
        `Kunde inte räkna antalet nomineringar för valet ${electionId} och posten ${postname}, count var ${JSON.stringify(
          i,
        )}`,
      );
      throw new ServerError('Kunde inte räkna antal nomineringar');
    }

    return i.count;
  }

  /**
   * Hittar alla valberedningens nomineringar för ett val.
   * @param electionId ID på ett val
   */
  async getAllProposals(electionId: string): Promise<DatabaseProposal[]> {
    const p = await knex<DatabaseProposal>(PROPOSAL_TABLE).where('refelection', electionId);

    validateNonEmptyArray(p, `Hittade inte Valberedningens förslag för valet med ID ${electionId}`);

    return p;
  }

  /**
   * Hittar alla valbara poster (postnamn) för ett val.
   * @param electionId ID på ett val
   * @returns Lista på `postnames`
   */
  async getAllElectables(electionId: string): Promise<string[]> {
    const e = await knex<string>(ELECTABLE_TABLE).where('refelection', electionId);

    validateNonEmptyArray(e, `Hittade inga valbara poster för valet med ID ${electionId}`);

    return e;
  }
}
