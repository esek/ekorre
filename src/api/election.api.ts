import { NotFoundError, BadRequestError, ServerError } from '../errors/RequestErrors';
import { NominationAnswer } from '../graphql.generated';
import { Logger } from '../logger';
import {
  DatabaseElectable,
  DatabaseElection,
  DatabaseNomination,
  DatabaseProposal,
} from '../models/db/election';
import { validateNonEmptyArray } from '../services/validation.service';
import { ELECTION_TABLE, NOMINATION_TABLE, PROPOSAL_TABLE, ELECTABLE_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('ElectionAPI');

export class ElectionAPI {
  /**
   * @param limit Gräns på antal möten. Om null ges alla möten
   * @returns Senaste mötet som skapades
   * @throws `NotFoundError`
   */
  async getLatestElections(limit?: number): Promise<DatabaseElection[]> {
    const query = knex<DatabaseElection>(ELECTION_TABLE).select('*').orderBy('id', 'desc');

    if (limit != null) {
      query.limit(limit);
    }

    const e = await query;

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
   * Returnerar en lista med alla val som matchar något av de angivna ID:n.
   * @param electionIds En lista med `electionId`
   * @returns En lista med val
   */
  async getMultipleElections(
    electionIds: string[] | readonly string[],
  ): Promise<DatabaseElection[]> {
    const e = await knex<DatabaseElection>(ELECTION_TABLE).whereIn('id', electionIds);

    validateNonEmptyArray(e, 'Hittade inte något möte alls');

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

    validateNonEmptyArray(
      n,
      `Hittade inga nomineringar för posten ${postname} för mötet med ID ${electionId}`,
    );

    return n;
  }

  /**
   * Returnerar alla nomineringar för valet, om specificerat endast
   * de med ett specifikt svar.
   * @param electionId ID på ett val
   * @param answer Vilken typ av svar som ska returneras. Om `undefined`/`null` ges alla
   * @returns Lista över nomineringar
   * @throws `NotFoundError`
   */
  async getAllNominations(
    electionId: string,
    answer?: NominationAnswer,
  ): Promise<DatabaseNomination[]> {
    const query = knex<DatabaseNomination>(NOMINATION_TABLE).where('refelection', electionId);

    if (answer != null) {
      query.and.where('accepted', answer);
    }

    const n = await query;

    validateNonEmptyArray(n, `Hittade inga nomineringar för mötet med ID ${electionId}`);

    return n;
  }

  /**
   * Returnerar alla nomineringar för en användare för ett val, om specificerat endast
   * de med ett specifikt svar.
   * @param electionId ID på ett val
   * @param username Användarnamnet
   * @param answer Vilken typ av svar som ska returneras. Om `undefined`/`null` ges alla
   * @returns Lista över nomineringar
   * @throws `NotFoundError`
   */
  async getAllNominationsForUser(
    electionId: string,
    username: string,
    answer?: NominationAnswer,
  ): Promise<DatabaseNomination[]> {
    const query = knex<DatabaseNomination>(NOMINATION_TABLE)
      .where('refelection', electionId)
      .and.where('refuser', username);

    if (answer != null) {
      query.and.where('accepted', answer);
    }

    const n = await query;

    validateNonEmptyArray(n, `Hittade inga nomineringar för användaren ${username}`);

    return n;
  }

  /**
   * Räknar antalet nomineringar för en post och ett möte. Om posten utelämnas returneras
   * det totala antalet nomineringar.
   * @param electionId ID på ett val
   * @param postname Namnet på posten
   * @returns Ett heltal (`number`)
   */
  async getNumberOfNominations(electionId: string, postname?: string): Promise<number> {
    const query = knex(NOMINATION_TABLE)
      .where('refelection', electionId)
      .count<Record<string, number>>('refelection AS count');

    if (postname != null) {
      query.where('refpost', postname);
    }

    const i = await query.first();

    if (i == null || i.count == null) {
      logger.debug(
        `Kunde inte räkna antalet nomineringar för valet ${electionId} och posten ${
          postname ?? 'alla poster'
        }, count var ${JSON.stringify(i)}`,
      );
      throw new ServerError('Kunde inte räkna antal nomineringar');
    }

    return i.count;
  }

  /**
   * Räknar antalet förslag för en post och ett möte. Om posten utelämnas returneras
   * det totala antalet förslag.
   * @param electionId ID på ett val
   * @param postname Namnet på posten
   * @returns Ett heltal (`number`)
   */
  async getNumberOfProposals(electionId: string, postname?: string): Promise<number> {
    const query = knex(PROPOSAL_TABLE)
      .where('refelection', electionId)
      .count<Record<string, number>>('refelection AS count');

    if (postname != null) {
      query.where('refpost', postname);
    }

    const i = await query.first();

    if (i == null || i.count == null) {
      logger.debug(
        `Kunde inte räkna antalet förslag för valet ${electionId} och posten ${
          postname ?? 'alla poster'
        }, count var ${JSON.stringify(i)}`,
      );
      throw new ServerError('Kunde inte räkna antal förslag');
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
    const electableRows = await knex<DatabaseElectable>(ELECTABLE_TABLE)
      .select('refpost')
      .where('refelection', electionId);

    const refposts = electableRows.map((e) => e.refpost);

    validateNonEmptyArray(refposts, `Hittade inga valbara poster för valet med ID ${electionId}`);

    return refposts;
  }

  /**
   * Skapar ett nytt val, förutsatt att det inte finns några öppna val,
   * eller val som inte har ett datum de stängdes.
   * @param creatorUsername Användarnamnet på skaparen av valet
   * @param electables En lista med postnamn
   * @param nominationsHidden Om nomineringar ska vara dolda för alla utom den som blivit nominerad och valadmin
   * @returns `electionId` hos skapade mötet
   */
  async createElection(
    creatorUsername: string,
    electables: string[],
    nominationsHidden: boolean,
  ): Promise<string> {
    // Vi försäkrar oss om att det senaste valet är stängt
    const lastElection = (await this.getLatestElections(1))[0];
    if (lastElection == null) {
      // Fortsätt
    } else if (lastElection.open || lastElection.closedAt == null) {
      throw new BadRequestError(
        'Det finns ett öppet val, eller ett val som väntar på att bli öppnat redan.',
      );
    }

    const electionId = (
      await knex<DatabaseElection>(ELECTION_TABLE).insert(
        {
          refcreator: creatorUsername,
          nominationsHidden,
        },
        'id', // Return `id` of created election
      )
    )[0];

    if (electionId == null) {
      logger.error('Failed to create new election for unknown reason');
      throw new ServerError('Kunde inte skapa ett nytt val');
    }

    if (electables.length !== 0) {
      const electableRows: DatabaseElectable[] = electables.map((e) => {
        return { refelection: electionId, refpost: e };
      });
      const res = await knex(ELECTABLE_TABLE).insert(electableRows);

      // Vi vill ju ha lagt till lika många rader som det finns poster
      // i electables
      if (res[0] !== electables.length) {
        logger.debug(
          `Could not insert all electables when creating election with ID ${electionId}`,
        );
        throw new ServerError(
          'Kunde inte lägga till alla valbara poster. Försök lägga till dessa manuellt',
        );
      }
    }

    return electionId;
  }

  /**
   * Försöker att lägga till alla poster som valbara i det specificerade valet.
   * @param electionId ID på ett val
   * @param postnames Lista på postnamn
   */
  async addElectables(electionId: string, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga postnamn specificerade');
    }

    const electableRows: DatabaseElectable[] = postnames.map((postname) => {
      return { refelection: electionId, refpost: postname };
    });

    try {
      await knex(ELECTABLE_TABLE).insert(electableRows);
    } catch (err) {
      logger.debug(`Could not insert all electables for election with ID ${electionId} due to error\n\t${JSON.stringify(err)}`);
      throw new ServerError('Kunde inte lägga till alla valbara poster');
    }

    return true;
  }

  /**
   * Tar bort alla poster som valbara i det specificerade valet
   * @param electionId ID på ett val
   * @param postnames Lista på postnamn
   */
  async removeElectables(electionId: string, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga postnamn specificerade');
    }

    const res = await knex(ELECTABLE_TABLE)
      .delete()
      .where('refelection', electionId)
      .and.whereIn('refpost', postnames);

    if (res !== postnames.length) {
      logger.debug(`Could not delete all electables for election with ID ${electionId}`);
      throw new ServerError('Kunde inte ta bort alla valbara poster');
    }

    return true;
  }

  /**
   * Ändrar om nomineringar är dolda eller ej för ett val.
   * @param electionId ID på ett val
   * @param hidden Om alla ska kunna vem som tackat ja till vad eller ej
   * @returns Om en ändring gjordes eller ej
   */
  async setHiddenNominations(electionId: string, hidden: boolean): Promise<boolean> {
    const res = await knex<DatabaseElection>(ELECTION_TABLE)
      .update('nominationsHidden', hidden)
      .where('id', electionId);
    return res > 0;
  }

  /**
   * Öppnar ett val, förutsatt att det inte redan stängts en gång
   * @param electionId ID på ett val
   */
  async openElection(electionId: string): Promise<boolean> {
    // Markerar valet som öppet, men bara om det inte redan stängts
    const res = await knex<DatabaseElection>(ELECTION_TABLE)
      .update({
        openedAt: Date.now(), // Current timestamp
        open: true,
      })
      .where('id', electionId)
      .whereNull('closedAt');

    if (res === 0) {
      throw new BadRequestError('Antingen är valet redan stängt, eller så finns det inte.');
    }

    return true;
  }

  /**
   * Stänger alla öppna val, men ger ett fel om fler än ett måste stängas,
   * då endast ett ska kunna vara öppet samtidigt.
   */
  async closeElection(): Promise<boolean> {
    const res = await knex<DatabaseElection>(ELECTION_TABLE)
      .update({
        closedAt: knex.fn.now(), // Current timestamp
        open: false,
      })
      .where({ open: true });

    if (res > 1) {
      logger.warn(
        'VARNING: Anrop till closeElection stängde mer än ett val! Endast ett val ska kunna vara öppet samtidigt!',
      );
      throw new ServerError(
        'Mer än ett val stängdes, men fler än ett val ska inte kunna vara öppna samtidigt!',
      );
    }

    if (res === 0) {
      throw new BadRequestError('Antingen är valet redan stängt, eller så finns det inte.');
    }

    return true;
  }

  /**
   * Försöker hitta ett öppet val och om det finns, nominerar
   * användaren till alla poster.
   * @param username Användarnamn på den som ska nomineras
   * @param postnames Namnet på alla poster personen ska nomineras till
   */
  async nominate(username: string, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga postnamn specificerade');
    }

    const openElectionId = await this.getOpenElectionId();

    const nominationRows: DatabaseNomination[] = postnames.map((postname) => ({
      refelection: openElectionId,
      refuser: username,
      refpost: postname,
      accepted: NominationAnswer.NoAnswer,
    }));

    try {
      await knex<DatabaseNomination>(NOMINATION_TABLE).insert(nominationRows);
    } catch (err) {
      logger.debug(
        `Could not insert all nominations for election with ID ${openElectionId} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError('Kunde inte nominera till alla poster');
    }

    return true;
  }

  async respondToNomination(
    username: string,
    postname: string,
    accepts: NominationAnswer,
  ): Promise<boolean> {
    const openElectionId = await this.getOpenElectionId();
    const res = await knex<DatabaseNomination>(NOMINATION_TABLE).update('accepted', accepts).where({
      refelection: openElectionId,
      refuser: username,
      refpost: postname,
    });

    return res > 0;
  }

  /**
   * Returnerar ID:t på det öppna valet. Används för att kontrollera att
   * nomineringar och svar på nomineringar bara sker då ett val är öppet.
   * @throws `BadRequestError` om det inte finns några öppna val
   */
  private async getOpenElectionId(): Promise<string> {
    try {
      const openElection = await this.getOpenElection();
      return openElection.id;
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new BadRequestError('Det finns inget öppet val!');
      } else {
        throw new ServerError('Något gick fel när det öppna valet försökte hittas');
      }
    }
  }

  /**
   * Lägger till ett förslag från valberedningen för en post. Kontrollerar
   * inte att det finns lika många platser (`Post.spots`) som förslag,
   * då det minskar prestanda, och valberedningen kan välja att
   * överföreslå.
   * @param electionId ID på ett val
   * @param username Användarnamn på den som ska föreslås
   * @param postname Posten användaren ska föreslås på
   */
  async propose(electionId: string, username: string, postname: string): Promise<boolean> {
    const res = await knex<DatabaseProposal>(PROPOSAL_TABLE).insert({
      refelection: electionId,
      refuser: username,
      refpost: postname,
    });

    return res[0] > 0;
  }
}
