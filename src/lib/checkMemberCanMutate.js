import debug from 'debug';
import { dataSources } from '@thatconference/api';
import memberLib from '../dataSources/cloudFirestore/member';
import orderLib from '../dataSources/cloudFirestore/order';
import constants from '../constants';

const eventLib = dataSources.cloudFirestore.event;
const dlog = debug('that:api:sessions:checkMemberCanMutate');

export default function checkMemberCanMutate({ user, eventId, firestore }) {
  dlog('checkMemberCanMutate called for event %s', eventId);
  const memberId = user.sub;
  let orderStore;
  let eventStore;
  let memberStore;
  try {
    orderStore = orderLib(firestore);
    eventStore = eventLib(firestore);
    memberStore = memberLib(firestore);
  } catch (err) {
    return Promise.reject(err);
  }

  const memberFunc = memberStore.find(memberId);
  const eventFunc = eventStore.get(eventId);
  const allocationFunc = orderStore.findMeOrderAllocationsForEvent({
    memberId,
    eventId,
  });

  return Promise.all([memberFunc, eventFunc, allocationFunc]).then(data => {
    const [member, event, allocations] = data;
    if (!event) throw new Error('Event record could not be found');
    const {
      isTicketRequiredToMutate = false,
      canMembershipMutate = false,
      callForSpeakersOpenDate,
      callForSpeakersCloseDate,
    } = event;
    if (!member) return false;
    const { isMember = false } = member;
    const tickets = allocations.filter(
      a => a.productType === constants.THAT.PRODUCT_TYPE.TICKET,
    );
    dlog('tickets:: %o', tickets);

    const now = new Date();
    let canMutate = false;

    if (user.permissions.includes('admin')) canMutate = true;
    else if (callForSpeakersOpenDate < now && callForSpeakersCloseDate > now)
      canMutate = true;
    else if (!isTicketRequiredToMutate) canMutate = true;
    else if (isTicketRequiredToMutate && canMembershipMutate)
      canMutate = tickets.length > 0 || isMember;
    else if (isTicketRequiredToMutate && !canMembershipMutate)
      canMutate = tickets.length > 0;

    dlog('canMutate::', canMutate);
    return canMutate;
  });
}
