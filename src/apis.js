const osmApiUrl = new URLSearchParams(location.search).get('osmApiUrl') || 'https://api.openstreetmap.org/api/0.6';
export const apis = {
  bounding: {
    api: osmApiUrl + '/map?bbox=',
    url: (left, bottom, right, top) => {
      return apis.bounding.api + left + ',' + bottom + ',' + right + ',' + top;
    },
  },
  getRelation: {
    api: osmApiUrl + '/relation/',
    parameters: '/full',
    url: (relationId) => {
      return apis.getRelation.api + relationId + apis.getRelation.parameters;
    },
  },
  getWay: {
    api: osmApiUrl + '/way/',
    parameters: '/full',
    url: (wayId) => {
      return apis.getWay.api + wayId + apis.getWay.parameters;
    },
  },
};
