let apis = {
  bounding: {
    api:'https://api.openstreetmap.org/api/0.6/map?bbox=',
    url: (left, bottom, right, top) => {
      return apis.bounding.api + left + ',' + bottom + ',' + right + ',' + top;
    },
  },
  getRelation: {
    api:'https://api.openstreetmap.org/api/0.6/relation/',
    parameters:'/full',
    url: (relationId) => {
      return apis.getRelation.api + relationId + apis.getRelation.parameters;
    },
  },
  getWay: {
    api:'https://api.openstreetmap.org/api/0.6/way/',
    parameters:'/full',
    url: (wayId) => {
      return apis.getWay.api + wayId + apis.getWay.parameters;
    },
  },
};
