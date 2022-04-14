let apis = {
  bounding: {
    api:'https://beakerboy.github.io/OSMBuilding/test/data/map/',
    url: (left, bottom, right, top) => {
      return apis.bounding.api + left + ',' + bottom + ',' + right + ',' + top;
    }
  },
  getRelation: {
    api:'https://beakerboy.github.io/OSMBuilding/test/data/relation/',
    url: (relationId) => {
      return apis.getRelation.api + relationId;
    }
  },
  getWay: {
    api:'https://beakerboy.github.io/OSMBuilding/test/data/way/',
    url: (wayId) => {
      return apis.getWay.api + wayId;
    }
  }
};
