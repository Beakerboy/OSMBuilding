var camera;
var renderer;
var controls;
var scene = new THREE.Scene();
var home;
var helper_size;
var building = {};

  let apis = {
    bounding: {
      api:"https://api.openstreetmap.org/api/0.6/map?bbox=",
      url: (left, bottom, right, top) => {
        return apis.bounding.api + left + "," + bottom + "," + right + "," + top;
      }
    },
    get_relation: {
      api:"https://api.openstreetmap.org/api/0.6/relation/",
      parameters:"/full",
      url: (relation_id) => {
        return apis.get_relation.api + relation_id + apis.get_relation.parameters;
      }
    },
    get_way: {
      api:"https://api.openstreetmap.org/api/0.6/way/",
      parameters:"/full",
      url: (way_id) => {
        return apis.get_way.api + way_id + apis.get_way.parameters;
      }
    }
  };

/**
 * Initialize the screen
 */
function init() {
  building.isReady = false;
  var type = "way";
  var id = 66418809;
  if (window.location.search.substr(1) !== null) {
    window.location.search.substr(1).split("&")
      .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === "type") {
          type = decodeURIComponent(tmp[1]);
        } else if (tmp[0] === "id") {
          id = decodeURIComponent(tmp[1]);
        }
      });
  }
  building = Building.create(id);
  camera = new THREE.PerspectiveCamera(
    50,
    document.documentElement.clientWidth /
      document.documentElement.clientHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({
    alpha: false
  });
  renderer.setSize(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight-20
  );
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.zIndex = 0;
  renderer.domElement.style.top = 0;
  document.body.appendChild(renderer.domElement);
}

/**
 * Create the scene
 */
function createScene() {
  addLights();
 
  camera.position.set(0, 0, 200); // x y z
  
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  function render() {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
  }
  while (!building.isReady) {
  }
  building.render();
  render();
}

function addLights() {
  const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.2 );
  scene.add( ambientLight );
  
  var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
  hemiLight.position.set( 0, 500, 0 );
  scene.add( hemiLight );

  var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  dirLight.position.set( -1, 0.75, 1 );
  dirLight.position.multiplyScalar( 1000 );
  //dirLight.name = "dirlight";
   // dirLight.shadowCameraVisible = true;

   scene.add( dirLight );

   //dirLight.castShadow = true;
   //dirLight.shadowMapWidth = dirLight.shadowMapHeight = 1024*2;

   //var d = 300;

   //dirLight.shadowCameraLeft = -d;
   //dirLight.shadowCameraRight = d;
   //dirLight.shadowCameraTop = d;
   //dirLight.shadowCameraBottom = -d;

   //dirLight.shadowCameraFar = 3500;
   //dirLight.shadowBias = -0.0001;
   //dirLight.shadowDarkness = 0.35;
}

/**
 * Find the center of a closed way
 *
 * Need to compensate for edge cases
 *  - ways that cross the date line
 * way DOM tree of the way to render
 * xml_data the DOM tree of all the data in the region
 */
function centroid(way, xml_data) {
  const elements = way.getElementsByTagName("nd");
  var lat_sum = 0;
  var lon_sum = 0;
  var lat = 0;
  var lon = 0;
  for (let i = 0; i < elements.length; i++) {
    var ref = elements[i].getAttribute("ref");
    var node = xml_data.querySelector('[id="' + ref + '"]');
    lat = parseFloat(node.getAttribute("lat"));
    lon = parseFloat(node.getAttribute("lon"));
    lat_sum += lat;
    lon_sum += lon;
  }
  const center = [lat_sum / elements.length, lon_sum / elements.length];
  return repositionPoint(center);
}

/**
 * Given a way in XML format, determine its height
 * Default to 3 meters unless building:levels or height are specified.
 */
function calculateWayHeight(way) {
  var height = 3;
  
  if (way.querySelector('[k="height"]') !== null) {
    // if the buiilding part has a helght tag, use it.
    height = way.querySelector('[k="height"]').getAttribute('v');
  } else if (way.querySelector('[k="building:levels"]') !== null) {
    // if not, use building:levels and 3 meters per level.
    height = 3 * way.querySelector('[k="building:levels"]').getAttribute('v');
  } else if (way.querySelector('[k="building:part"]') !== null) {
    if (way.querySelector('[k="building:part"]').getAttribute('v') === "roof") {
      // a roof has no height by default.
      height = 0;
    }
  }
  
  return height;
}

function calculateWayMinHeight(way) {
  var min_height = 0;
  if (way.querySelector('[k="min_height"]') !== null) {
    // if the buiilding part has a min_helght tag, use it.
    min_height = way.querySelector('[k="min_height"]').getAttribute('v');
  } else if (way.querySelector('[k="building:min_level"]') !== null) {
    // if not, use building:min_level and 3 meters per level.
    min_height = 3 * way.querySelector('[k="building:min_level"]').getAttribute('v');
  }
  return min_height;
}

function calculateRoofHeight(way) {
  var height = 0;
  if (way.querySelector('[k="roof:height"]') !== null) {
    // if the buiilding part has a min_helght tag, use it.
    height = way.querySelector('[k="roof:height"]').getAttribute('v');
  } else if (way.querySelector('[k="roof:levels"]') !== null) {
    // if not, use building:min_level and 3 meters per level.
    min_height = 3 * way.querySelector('[k="roof:levels"]').getAttribute('v');
  }
  return height;
}

function calculateWayRadius(way, xml_data) {
  const elements = way.getElementsByTagName("nd");
  var lats = [];
  var lons = [];
  var lat = 0;
  var lon = 0;
  for (let i = 0; i < elements.length; i++) {
    ref = elements[i].getAttribute("ref");
    node = xml_data.querySelector('[id="' + ref + '"]');
    lat = node.getAttribute("lat");
    lon = node.getAttribute("lon");
    var point = repositionPoint([lat, lon]);
    lats.push(point[0]);
    lons.push(point[1]);
  }
  const left = Math.min(...lons);
  const bottom = Math.min(...lats);
  const right = Math.max(...lons);
  const top = Math.max(...lats);

  // Set the "home point", the lat lon to center the structure.
  return Math.min(right - left, top - bottom) / 2;
}

  init();
  createScene();
  window.addEventListener("resize", resize, false);

function resize() {
  camera.aspect =
    document.documentElement.clientWidth /
    document.documentElement.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
  ); 
}
