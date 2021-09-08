import debug from 'debug';
import * as Sentry from '@sentry/node';
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
    field.resolve = async function (...args) {
      dlog('field.resolve called');
      // dlog('the args:: %O', args);
      // eslint-disable-next-line no-unused-vars
      const [id, sessionArg, context] = args;
      dlog('id %o', id);

      let { eventId } = id;
      const { sessionId } = id;
      if (!eventId && !sessionId)
        throw new ForbiddenError('invalid id argument');

      const { user, dataSources } = context;
      const { firestore } = dataSources;

      if (sessionId) {
        const session = await sessionStore(firestore).findSession(sessionId);
        if (!session) throw new ForbiddenError('invalid session id');
        eventId = session.eventId;
      }

      const allowResult = await checkMemberCanMutate({
        user,
        eventId,
        firestore,
      });
      if (!allowResult) {
        const err = new ForbiddenError(
          'Insufficient privileges to mutate session in this event',
        );
        Sentry.configureScope(scope => {
          scope.setLevel(Sentry.Severity.Info);
          Sentry.captureException(err);
        });
        throw err;
      }
      return resolve.apply(this, args);
    };
  }
}

export default CanMutateDirective;
