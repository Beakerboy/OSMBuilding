import * as THREE from "three";
import { OrbitControls } from "https://unpkg.com/three@0.138.3/examples/jsm/controls/OrbitControls.js";
var camera;
var renderer;
var controls;
function init() {
  var scene = new THREE.Scene();
  console.log(scene);
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
    document.documentElement.clientHeight
  );
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.zIndex = 1;
  renderer.domElement.style.top = 0;
  document.body.appendChild(renderer.domElement);
}

function createScene() {
  var shapes = [];
  shapes = buildStructure();
  scene.add(shapes[0]);

  var pointLight = new THREE.PointLight(0x888888);
  pointLight.position.set(0, 0, 500);
  scene.add(pointLight);
  camera.position.set(0, -0.2, 0.05); // x y z
  
  controls = new OrbitControls( camera, renderer.domElement );
  function render() {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
  }
  render();
}

function buildStructure() {
  const shape = new THREE.Shape();
  shape.moveTo( 0,0 );
  shape.lineTo(-0.00334221071354316, 0.00214606248974563);
  shape.lineTo(-0.0102992676390634, -0.00863984195985584);
  shape.lineTo(-0.0112787090595599, -0.01018545067456);
  shape.lineTo(-0.0128235984597185, -0.00919581447966572);
  shape.lineTo(-0.0131366152502848, -0.00900678281170997);
  shape.lineTo(-0.0184680125582434, -0.0176577420050943);
  shape.lineTo(-0.0185689860616975, -0.0178245342584978);
  shape.lineTo(-0.0170543880113595, -0.0187474541039572);
  shape.lineTo(-0.0142574297782269, -0.0204820981293447);
  shape.lineTo(-0.0182155915337531, -0.0268869212521896);
  shape.lineTo(-0.0176198492626782, -0.0272538652824106);
  shape.lineTo(-0.0179530619912907, -0.0277764810083699);
  shape.lineTo(-0.019457568225284, -0.0301115724318597);
  shape.lineTo(-0.0189829973796084, -0.0330137606770485);
  shape.lineTo(-0.0164687618963209, -0.0346372098312306);
  shape.lineTo(-0.0153378606188103, -0.0353822171414835);
  shape.lineTo(-0.0166606146864636, -0.0373948437829391);
  shape.lineTo(-0.0173977164535165, -0.0340478755832767);
  shape.lineTo(-0.0197806892807556, -0.0344926520820894);
  shape.lineTo(-0.0200230238316585, -0.0333807024678589);
  shape.lineTo(-0.0219314215948422, -0.0337810013053674);
  shape.lineTo(-0.0223151175716221, -0.031968523385059);
  shape.lineTo(-0.0254957755129033, -0.0300114871716771);
  shape.lineTo(-0.0290500397629584, -0.0308120836262006);
  shape.lineTo(-0.0312108775341655, -0.0341590462053941);
  shape.lineTo(-0.030928155079577, -0.0355267444375233);
  shape.lineTo(-0.0345228102908489, -0.036271741931065);
  shape.lineTo(-0.0363504376296171, -0.0395186291006747);
  shape.lineTo(-0.0355931462435491, -0.0431658246687809);
  shape.lineTo(-0.0325134604166561, -0.0452229384023778);
  shape.lineTo(-0.0270709874937128, -0.0440109254397224);
  shape.lineTo(-0.0263237901672055, -0.0473467746820101);
  shape.lineTo(-0.0247587003767447, -0.047002073305586);
  shape.lineTo(-0.0209318037272434, -0.0461569981899915);
  shape.lineTo(-0.0212246247874284, -0.0448226586250603);
  shape.lineTo(-0.0188820394151539, -0.0443000458692066);
  shape.lineTo(-0.017710746789074, -0.0440331795965266);
  shape.lineTo(-0.0180338600517253, -0.0426210036093708);
  shape.lineTo(-0.0159437088674449, -0.0421428679956336);
  shape.lineTo(-0.0160345845402895, -0.041764805140003);
  shape.lineTo(-0.0141059911204468, -0.0413311470305399);
  shape.lineTo(-0.0131770340011564, -0.039896733393265);
  shape.lineTo(-0.0118037933950695, -0.0377729115375537);
  shape.lineTo(-0.00370572610410896, -0.0429990776352105);
  shape.lineTo(-0.00275657567007482, -0.0436106499527256);
  shape.lineTo(-0.00159538058401527, -0.0418204118176191);
  shape.lineTo(-0.000262530998651436, -0.0426766128418776);
  shape.lineTo(0.00268589317233538, -0.038106501099305);
  shape.lineTo(0.00132275181559164, -0.0372280613766617);
  shape.lineTo(0.0023930697953703, -0.0355823763166392);
  shape.lineTo(0.000222141477189345, -0.0341813204475277)
  shape.lineTo(0.0029787143449147, -0.0299114349462954);
  shape.lineTo(0.000787592186205335, -0.0284992596742292);
  shape.lineTo(-0.000797689463698829, -0.0274762663491667);
  shape.lineTo(-8.07786743104447E-05, -0.0263643171073348);
  shape.lineTo(0.000333212034380562, -0.0266311849269589);
  shape.lineTo(0.00280705817622906, -0.0228060791679909);
  shape.lineTo(0.00234258087341299, -0.0225058529538473);
  shape.lineTo(0.00309988045972091, -0.0213271865816886);
  shape.lineTo(0.00474574569218012, -0.022383537918609);
  shape.lineTo(0.00682579659669285, -0.023728995658241);
  shape.lineTo(0.00972372782797349, -0.0192923163492262);
  shape.lineTo(0.0119552387974952, -0.0207489681377958);
  shape.lineTo(0.0130659434746331, -0.0190254457689014);
  shape.lineTo(0.0143684997698259, -0.0198705259182746);
  shape.lineTo(0.017185649270816, -0.0155228010689383);
  shape.lineTo(0.0158628985489808, -0.0146666017178484);
  shape.lineTo(0.0162667908409384, -0.0140439096557374);
  shape.lineTo(0.0170139914652462, -0.0128763620265918);
  shape.lineTo(0.0162062049063562, -0.0123537468431454);
  shape.lineTo(0.00794659085616051, -0.00700527809264542);
  shape.lineTo(0.010854615491543, -0.00251300107675607);
  shape.lineTo(0.0122177529750158, -0.00220165414262481);
  shape.lineTo(0.0116523011688062, 0.000266872737289812);
  shape.lineTo(0.0153075281673358, 0.00110083825638811);
  shape.lineTo(0.0141564291864795, 0.00614908669785659);
  shape.lineTo(0.0123894002248313, 0.00574878326377271);
  shape.lineTo(0.0122581346732822, 0.0063269967655671);
  shape.lineTo(0.0136818551027648, 0.00664946338981648);
  shape.lineTo(0.0126216332812939, 0.0113196492992481);
  shape.lineTo(0.0122985181927307, 0.0127540635632524);
  shape.lineTo(0.00998623559299102, 0.0122314455413212);
  shape.lineTo(0.00876445815666984, 0.0176132791604933);
  shape.lineTo(0.00510923400557087, 0.0198260563657617);
  shape.lineTo(0.00137323293636118, 0.0190143325253614);
  shape.lineTo(-0.000737103160083955, 0.0155228117806955);
  shape.lineTo(-6.05838365582522E-05, 0.0122092029456009);
  shape.lineTo(-0.00202955855983936, 0.0118089013590405);
  shape.lineTo(-0.00399853429024513, 0.00832850058423338);
  shape.lineTo(-0.00315036127073476, 0.00429212452927994);
  shape.lineTo(-0.000161557010235375, 0.00244628838771865);
  shape.lineTo(0.00201946255158466, 0.00292442671904039);
  shape.lineTo(0.00289792961191829, -0.00112306845452108);
  shape.lineTo(0.0003433086933032, 0.000522616160266608);
  shape.lineTo(0, 0);

  const extrudeSettings = {
    depth: 0.01,
    bevelEnabled: false,
    steps: 2
  };
  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  var material = new THREE.MeshLambertMaterial({
    color: 0x0064ff,
    emissive: 0x1111111
  });

  var shapes = [];
  shapes[0] = new THREE.Mesh(geometry, material);
  shapes[0].position.set(0, 0, 0);
  return shapes
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
