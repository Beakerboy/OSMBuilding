let apis = {
  bounding: {
    api:"https://beakerboy.github.io/OSMBuilding/test/map/",
    url: (left, bottom, right, top) => {
      return apis.bounding.api + left + "," + bottom + "," + right + "," + top;
    }
  },
  get_relation: {
    api:"https://beakerboy.github.io/OSMBuilding/test/relation/",
    url: (relation_id) => {
      return apis.get_relation.api + relation_id;
    }
  },
  get_way: {
    api:"https://beakerboy.github.io/OSMBuilding/test/way/",
    url: (way_id) => {
      return apis.get_way.api + way_id;
    }
  }
};
