/* eslint-disable no-param-reassign */
function shuffle(array) {
  let m = array.length;
  let t;
  let i;

  while (m) {
    // eslint-disable-next-line no-plusplus
    i = Math.floor(Math.random() * m--);

    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

export default shuffle;
