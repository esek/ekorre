/* eslint-disable @typescript-eslint/indent */
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import {
  DatabaseElectable,
  DatabaseElection,
  DatabaseNomination,
  DatabaseProposal,
} from '@db/election';
import { NominationAnswer } from '@generated/graphql';

import { ELECTABLE_TABLE, ELECTION_TABLE, NOMINATION_TABLE, PROPOSAL_TABLE } from './constants';
import db from './knex';

const logger = Logger.getLogger('ElectionAPI');

export class ElectionAPI {
  /**
   * @param limit Gräns på antal möten. Om null ges alla möten
   * @returns Senaste mötet som skapades
   */
  async getLatestElections(
    limit?: number,
    includeUnopened: boolean = true,
  ): Promise<DatabaseElection[]> {
    const query = db<DatabaseElection>(ELECTION_TABLE).select('*').orderBy('id', 'desc');

    if (!includeUnopened) {
      query.whereNotNull('openedAt');
    }

    if (limit != null) {
      query.limit(limit);
    }

    const e = await query;

    return e;
  }

  /**
   * @returns Senaste mötet markerat som `open`
   * @throws `NotFoundError`
   */
  async getOpenElection(): Promise<DatabaseElection> {
    const e = await db<DatabaseElection>(ELECTION_TABLE)
      .where('open', true)
      .orderBy('createdAt', 'desc')
      .first();

    if (e == null) {
      throw new NotFoundError('Hittade inga öppna val');
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
    const e = await db<DatabaseElection>(ELECTION_TABLE).whereIn('id', electionIds);

    return e;
  }

  /**
   * Returnerar alla nomineringar för posten och valet, men bara
   * poster man kan nomineras till.
   * @param electionId ID på ett val
   * @param postname Namnet på posten
   * @returns Lista över nomineringar
   */
  async getNominations(electionId: string, postname: string): Promise<DatabaseNomination[]> {
    // prettier-ignore
    const n = await db<DatabaseNomination>(NOMINATION_TABLE)
      .leftJoin<DatabaseElectable>(ELECTABLE_TABLE, (q) => {
        q.on(`${ELECTABLE_TABLE}.refelection`, `${NOMINATION_TABLE}.refelection`).andOn(
          `${ELECTABLE_TABLE}.refpost`,
          `${NOMINATION_TABLE}.refpost`,
        );
      })
      .where(`${NOMINATION_TABLE}.refelection`, electionId)
      .where(`${NOMINATION_TABLE}.refpost`, postname);

    return n;
  }

  /**
   * Returnerar alla nomineringar för valet, om specificerat endast
   * de med ett specifikt svar. Returnerar inte nomineringar som inte
   * finns som electables.
   * @param electionId ID på ett val
   * @param answer Vilken typ av svar som ska returneras. Om `undefined`/`null` ges alla
   * @returns Lista över nomineringar
   */
  async getAllNominations(
    electionId: string,
    answer?: NominationAnswer,
  ): Promise<DatabaseNomination[]> {
    // prettier-ignore
    const query = db<DatabaseNomination>(NOMINATION_TABLE)
      .join<DatabaseElectable>(ELECTABLE_TABLE, (q) => {
      q.on(`${ELECTABLE_TABLE}.refelection`, `${NOMINATION_TABLE}.refelection`).andOn(
        `${ELECTABLE_TABLE}.refpost`,
        `${NOMINATION_TABLE}.refpost`,
      );
    })
      .where(`${NOMINATION_TABLE}.refelection`, electionId);

    if (answer != null) {
      query.where('accepted', answer);
    }

    const n = await query;

    return n;
  }

  /**
   * Returnerar alla nomineringar för en användare för ett val, om specificerat endast
   * de med ett specifikt svar. Hämtar inte nomineringar som inte finns som electables
   * @param electionId ID på ett val
   * @param username Användarnamnet
   * @param answer Vilken typ av svar som ska returneras. Om `undefined`/`null` ges alla
   * @returns Lista över nomineringar
   */
  async getAllNominationsForUser(
    electionId: string,
    username: string,
    answer?: NominationAnswer,
  ): Promise<DatabaseNomination[]> {
    // prettier-ignore
    const query = db<DatabaseNomination>(NOMINATION_TABLE)
      .join<DatabaseElectable>(ELECTABLE_TABLE, (q) => {
      q.on(`${ELECTABLE_TABLE}.refelection`, `${NOMINATION_TABLE}.refelection`).andOn(
        `${ELECTABLE_TABLE}.refpost`,
        `${NOMINATION_TABLE}.refpost`,
      );
    })
      .where(`${NOMINATION_TABLE}.refelection`, electionId)
      .where(`${NOMINATION_TABLE}.refuser`, username);

    if (answer != null) {
      query.where('accepted', answer);
    }

    // Vi måste kontrollera att nomineringar är för
    // en valid electable
    const n = await query;

    return n;
  }

  /**
   * Räknar antalet nomineringar för en post och ett möte. Om posten utelämnas returneras
   * det totala antalet nomineringar. Svaret kan inte specificeras, då det lämnar ut för
   * mycket information. Räknar inte nomineringar som inte finns som electables.
   * @param electionId ID på ett val
   * @param postname Namnet på posten
   * @returns Ett heltal (`number`)
   */
  async getNumberOfNominations(electionId: string, postname?: string): Promise<number> {
    // prettier-ignore
    const query = db(NOMINATION_TABLE)
      .leftJoin<DatabaseElectable>(ELECTABLE_TABLE, (q) => {// eslint-disable indent
      q.on(`${ELECTABLE_TABLE}.refelection`, `${NOMINATION_TABLE}.refelection`).andOn(
        `${ELECTABLE_TABLE}.refpost`,
        `${NOMINATION_TABLE}.refpost`,
      );
    })
      .where(`${NOMINATION_TABLE}.refelection`, electionId)
      .count<Record<string, number>>(`${ELECTABLE_TABLE}.refelection AS count`);

    if (postname != null) {
      query.where(`${NOMINATION_TABLE}.refpost`, postname);
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
    const query = db(PROPOSAL_TABLE)
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
    const p = await db<DatabaseProposal>(PROPOSAL_TABLE).where('refelection', electionId);

    return p;
  }

  /**
   * Hittar alla valbara poster (postnamn) för ett val.
   * @param electionId ID på ett val
   * @returns Lista på `postnames`
   */
  async getAllElectables(electionId: string): Promise<string[]> {
    const electableRows = await db<DatabaseElectable>(ELECTABLE_TABLE)
      .select('refpost')
      .where('refelection', electionId);

    const refposts = electableRows.map((e) => e.refpost);

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
    if (lastElection != null && (lastElection?.open || lastElection?.closedAt == null)) {
      throw new BadRequestError(
        'Det finns ett öppet val, eller ett val som väntar på att bli öppnat redan.',
      );
    }

    const electionId = (
      await db<DatabaseElection>(ELECTION_TABLE).insert(
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

      try {
        await db(ELECTABLE_TABLE).insert(electableRows);
      } catch (err) {
        logger.debug(
          `Could not insert electables when creating election with ID ${electionId} due to error:\n\t${JSON.stringify(
            err,
          )}`,
        );
        throw new ServerError(
          'Kunde inte lägga till valbara poster. Försök lägga till dessa manuellt',
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
      await db(ELECTABLE_TABLE).insert(electableRows);
    } catch (err) {
      logger.debug(
        `Could not insert electables for election with ID ${electionId} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError('Kunde inte lägga alla valbara poster');
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

    const res = await db(ELECTABLE_TABLE)
      .delete()
      .where('refelection', electionId)
      .whereIn('refpost', postnames);

    if (res !== postnames.length) {
      logger.debug(`Could not delete all electables for election with ID ${electionId}`);
      throw new ServerError('Kunde inte ta bort alla valbara poster');
    }

    return true;
  }

  /**
   * Försöker att lägga till alla poster som valbara i det specificerade valet.
   * @param electionId ID på ett val
   * @param postnames Lista på postnamn
   */
  async setElectables(electionId: string, postnames: string[]): Promise<boolean> {
    const q = db<DatabaseElectable>(ELECTABLE_TABLE);

    try {
      // Remove existing electables
      await q.where({ refelection: electionId }).delete();

      if (postnames.length > 0) {
        const electableRows: DatabaseElectable[] = postnames.map((postname) => {
          return { refelection: electionId, refpost: postname };
        });

        await db(ELECTABLE_TABLE).insert(electableRows);
      }
    } catch (err) {
      logger.debug(
        `Could not insert electables for election with ID ${electionId} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError('Kunde inte lägga alla valbara poster');
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
    const res = await db<DatabaseElection>(ELECTION_TABLE)
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
    const res = await db<DatabaseElection>(ELECTION_TABLE)
      .update({
        openedAt: Date.now(), // Current timestamp
        open: true,
      })
      .where({
        id: electionId,
        openedAt: null, // Annars återställer vi ju timestamp om vi öppnar redan öppet val
        open: false,
      })
      .whereNull('closedAt');

    if (res === 0) {
      throw new BadRequestError(
        'Antingen är valet redan öppet eller stängt, eller så finns det inte.',
      );
    }

    return true;
  }

  /**
   * Stänger alla öppna val, men ger ett fel om fler än ett måste stängas,
   * då endast ett ska kunna vara öppet samtidigt.
   */
  async closeElection(): Promise<boolean> {
    const res = await db<DatabaseElection>(ELECTION_TABLE)
      .update({
        closedAt: Date.now(),
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
   * användaren till alla poster om de finns som electables.
   * @param username Användarnamn på den som ska nomineras
   * @param postnames Namnet på alla poster personen ska nomineras till
   */
  async nominate(username: string, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga postnamn specificerade');
    }

    const openElection = await this.getOpenElection();

    // Nomineringar måste finnas som electables
    const electables = await this.getAllElectables(openElection.id);
    const filteredPostnames = postnames.filter((e) => electables.includes(e));

    if (filteredPostnames.length === 0) {
      throw new BadRequestError('Ingen av de angivna posterna är valbara i detta val');
    }

    const nominationRows: DatabaseNomination[] = filteredPostnames.map((postname) => ({
      refelection: openElection.id,
      refuser: username,
      refpost: postname,
      accepted: NominationAnswer.NoAnswer,
    }));

    try {
      // Om nomineringen redan finns, ignorera den
      // utan att ge error för att inte avslöja
      // vad som finns i databasen redan
      await db<DatabaseNomination>(NOMINATION_TABLE)
        .insert(nominationRows)
        .onConflict(['refelection', 'refuser', 'refpost'])
        .ignore();
    } catch (err) {
      logger.debug(
        `Could not insert all nominations for election with ID ${
          openElection.id
        } due to error:\n\t${JSON.stringify(err)}`,
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
    const openElection = await this.getOpenElection();
    const res = await db<DatabaseNomination>(NOMINATION_TABLE).update('accepted', accepts).where({
      refelection: openElection.id,
      refuser: username,
      refpost: postname,
    });

    if (res === 0) {
      throw new NotFoundError('Kunde inte hitta nomineringen, eller så är valet stängt!');
    }

    return true;
  }

  /**
   * Lägger till ett förslag från valberedningen för en post. Kontrollerar
   * inte att det finns lika många platser (`Post.spots`) som förslag,
   * då det minskar prestanda, och valberedningen kan välja att
   * överföreslå. Kontrollerar inte heller om posten är valbar;
   * det får valberedningen lösa!
   * @param electionId ID på ett val
   * @param username Användarnamn på den som ska föreslås
   * @param postname Posten användaren ska föreslås på
   */
  async propose(electionId: string, username: string, postname: string): Promise<boolean> {
    try {
      await db<DatabaseProposal>(PROPOSAL_TABLE).insert({
        refelection: electionId,
        refuser: username,
        refpost: postname,
      });
      return true;
    } catch (err) {
      logger.error(
        `Could not insert proposal for user ${username} and post ${postname} in election with ID ${electionId} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError(`Kunde inte föreslå användaren ${username} till posten ${postname}`);
    }
  }

  /**
   * Försöker ta bort en av valberedningens förslag till en post.
   * @param electionId ID på valet
   * @param username Användarnamn på föreslagen person
   * @param postname Namnet på posten personen föreslagits till
   * @throws `ServerError` om förslaget inte kunde tas bort (eller det aldrig fanns)
   */
  async removeProposal(electionId: string, username: string, postname: string): Promise<boolean> {
    const res = await db<DatabaseProposal>(PROPOSAL_TABLE).delete().where({
      refelection: electionId,
      refuser: username,
      refpost: postname,
    });

    if (res === 0) {
      logger.error(
        `Could not delete proposal for user ${username} and post ${postname} in election with ID ${electionId}}`,
      );
      throw new ServerError(
        `Kunde inte ta bort föreslaget för användaren ${username} till posten ${postname}, vilket kan bero på att föreslaget inte fanns`,
      );
    }

    return true;
  }
}
