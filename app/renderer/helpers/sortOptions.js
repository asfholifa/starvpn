import sortBy from 'lodash/sortBy';
import startsWith from 'lodash/startsWith';
import toLower from 'lodash/toLower';

export default function sortOptions(options, keyProperty = 'key') {
  return sortBy(options, [
    (item) => !startsWith(toLower(item[keyProperty]), 'random'),
    keyProperty,
  ]);
}
