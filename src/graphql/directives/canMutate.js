import debug from 'debug';
import { SchemaDirectiveVisitor, ForbiddenError } from 'apollo-server-express';
import { defaultFieldResolver } from 'graphql';
import sessionStore from '../../dataSources/cloudFirestore/session';
import checkMemberCanMutate from '../../lib/checkMemberCanMutate';

const dlog = debug('that:api:sessions:directives:canMutate');

class CanMutateDirective extends SchemaDirectiveVisitor {
  // eslint-disable-next-line class-methods-use-this
  visitFieldDefinition(inField) {
    const field = inField;
    const { resolve = defaultFieldResolver } = field;
    // eslint-disable-next-line func-names
    field.resolve = async function(...args) {
      dlog('field.resolve called');
      // dlog('the args:: %O', args);
      const [id, sessionArg, context] = args;
      dlog('!!id %O', id);

      const { user, dataSources } = context;
      const memberId = user.sub;
      const { firestore } = dataSources;

      let eventId;
      if (id.sessionId) {
        const session = await sessionStore(firestore).findSession(id.sessionId);
        if (!session) throw new ForbiddenError('invalid session id');
        eventId = session.eventId;
      } else if (id.eventId) {
        eventId = id.eventId;
      } else throw new ForbiddenError('invalid id argument');

      const allowResult = await checkMemberCanMutate({
        memberId,
        eventId,
        firestore,
      });
      if (!allowResult)
        throw new ForbiddenError(
          'Insufficient privileges to mutate session in this event',
        );
      return resolve.apply(this, args);
    };
  }
}

export default CanMutateDirective;

/* CREATE
the args:: [
  { eventId: 'z0qa8EZD0BuWf4dU7UxB' },
  {
    openspace: {
      title: 'Brett Test canMutate',
      shortDescription: 'Testing what data is available from the directive',
      durationInMinutes: 30,
      tags: [ 'test', 'mentioning', 'token' ],
      status: 'ACCEPTED'
    }
  },
  {
    user: {
      iss: 'https://auth.that.tech/',
      sub: 'google-oauth2|113016658049923232156',
      aud: 'https://api.that.tech/graphql',
      iat: 1613183833,
      exp: 1613191033,
      azp: 'MOH0kvUcmJQhiyEZ7FAQZhnWGjQT6cvC',
      scope: '',
      permissions: [
        'admin',
        'communities',
        'events',
        'events:event:milestones',
        'events:event:notifications',
        'members',
        'partners',
        'partners:jobListing',
        'sessions',
        'slack:post',
        'venues'
      ],
      site: 'www.thatconference.com',
      correlationId: '9aa8dad3-28f8-42d2-9dd4-9e601dc8fb53'
    },
   _extensionStack: GraphQLExtensionStack { extensions: [] },
   dataSources: {
     sentry: {  
    ...
*/

/* UPDATE
the args:: [
  { sessionId: 'nvcrD6M13nbgUD3S5U2X' },
  {
    openspace: {
      shortDescription: 'Testing what data is available from the directive',
      startTime: 2021-02-13T04:00:00.000Z
    }
  },
  {
    user: {
      iss: 'https://auth.that.tech/',
      sub: 'google-oauth2|113016658049923232156',
      aud: 'https://api.that.tech/graphql',
      iat: 1613185435,
      exp: 1613192635,
      azp: 'MOH0kvUcmJQhiyEZ7FAQZhnWGjQT6cvC',
      scope: '',
      permissions: [
        'admin',
        'communities',
        'events',
        'events:event:milestones',
        'events:event:notifications',
        'members',
        'partners',
        'partners:jobListing',
        'sessions',
        'slack:post',
        'venues'
      ],
      site: 'www.thatconference.com',
      correlationId: '7de10c6e-313a-4584-b8a4-6236d335075b'
    },
   _extensionStack: GraphQLExtensionStack { extensions: [] },
   dataSources: {
     sentry: {
    ...
*/
