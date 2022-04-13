let apis = {
  bounding: {
    api:'https://api.openstreetmap.org/api/0.6/map?bbox=',
    url: (left, bottom, right, top) => {
      return apis.bounding.api + left + ',' + bottom + ',' + right + ',' + top;
    }
  },
  get_relation: {
    api:'https://api.openstreetmap.org/api/0.6/relation/',
    parameters:'/full',
    url: (relation_id) => {
      return apis.get_relation.api + relation_id + apis.get_relation.parameters;
    }
  },
  get_way: {
    api:'https://api.openstreetmap.org/api/0.6/way/',
    parameters:'/full',
    url: (way_id) => {
      return apis.get_way.api + way_id + apis.get_way.parameters;
    }
  }
};
