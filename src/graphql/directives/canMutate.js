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
      // eslint-disable-next-line no-unused-vars
      const [id, sessionArg, context] = args;
      dlog('!!id %O', id);

      const { user, dataSources } = context;
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
        user,
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
