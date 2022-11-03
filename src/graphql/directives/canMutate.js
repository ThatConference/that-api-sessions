import debug from 'debug';
import * as Sentry from '@sentry/node';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { ForbiddenError } from 'apollo-server-express';
import { defaultFieldResolver } from 'graphql';
import sessionStore from '../../dataSources/cloudFirestore/session';
import checkMemberCanMutate from '../../lib/checkMemberCanMutate';

const dlog = debug('that:api:sessions:directives:canMutate');

export default function canMutateDirectiveMapper(directiveName = 'canMutate') {
  dlog('canMutateDirectiveMapper called as %s', directiveName);

  return {
    canMutateDirectiveTransformer: schema =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: fieldConfig => {
          const canMutateDirective = getDirective(
            schema,
            fieldConfig,
            directiveName,
          )?.[0];
          if (canMutateDirective) {
            dlog('resolve: %s', fieldConfig?.astNode?.name?.value);
            const { resolve = defaultFieldResolver } = fieldConfig;
            return {
              ...fieldConfig,
              async resolve(source, args, context, info) {
                dlog('source: %o', source);
                dlog('args: %o', args);

                let { eventId } = source;
                const { sessionId } = source;
                if (!eventId && !sessionId)
                  throw new ForbiddenError('invalid source id argument');

                const { user, dataSources } = context;
                const { firestore } = dataSources;

                if (sessionId) {
                  const session = await sessionStore(firestore).findSession(
                    sessionId,
                  );
                  if (!session) throw new ForbiddenError('invalid session id');
                  eventId = session.eventId;
                }

                dlog('check can mutate');
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
                    scope.setLevel('info');
                    scope.setTags({
                      eventId,
                      memberId: user.sub,
                    });
                    Sentry.captureException(err);
                  });
                  throw err;
                }
                dlog('canMutate: true');
                return resolve(source, args, context, info);
              },
            };
          }

          return fieldConfig;
        },
      }),
  };
}
