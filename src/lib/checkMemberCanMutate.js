import debug from 'debug';
import memberLib from '../dataSources/cloudFirestore/member';
import eventLib from '../dataSources/cloudFirestore/event';
import orderLib from '../dataSources/cloudFirestore/order';
import constants from '../constants';

const dlog = debug('that:api:sessions:checkMemberCanMutate');

export default function checkMemberCanMutate({ user, eventId, firestore }) {
  dlog('checkMemberCanMutate called');
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
  const eventFunc = eventStore.getEvent(eventId);
  const allocationFunc = orderStore.findMeOrderAllocationsForEvent({
    memberId,
    eventId,
  });

  return Promise.all([memberFunc, eventFunc, allocationFunc]).then(data => {
    const [member, event, allocations] = data;
    if (!event) throw new Error('Event record could not be found');
    const {
      isTicketRequiredToMutate,
      canMembershipMutate,
      callForSpeakersOpenDate,
      callForSpeakersCloseDate,
    } = event;
    const { isMember } = member;
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

    return canMutate;
  });
}
