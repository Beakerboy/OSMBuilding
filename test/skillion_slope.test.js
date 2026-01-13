/**
 * @jest-environment jsdom
 */

import { Shape, Mesh } from 'three';
import { TextEncoder } from 'node:util';
import {expect, test, beforeEach, describe} from '@jest/globals';
global.TextEncoder = TextEncoder;

import {apis} from '../src/apis.js';
global.apis = apis;

import { Building } from '../src/building.js';

import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// Step 1: get the full data for the buiding from the API
const initialData = `<osm version="0.6" generator="openstreetmap-cgimap 2.1.0 (1885079 spike-08.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
<node id="13116569240" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551787" lon="-4.3313915"/>
<node id="13116569241" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550939" lon="-4.3314236"/>
<node id="13116569242" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551585" lon="-4.3312202"/>
<node id="13116569244" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550736" lon="-4.3312518"/>
<node id="13116569245" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551741" lon="-4.3313520"/>
<node id="13116569248" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551621" lon="-4.3312507"/>
<way id="1426868383" visible="true" version="2" changeset="175381161" timestamp="2025-12-02T00:38:17Z" user="philipcullen" uid="8857">
<nd ref="13116569242"/>
<nd ref="13116569248"/>
<nd ref="13116569245"/>
<nd ref="13116569240"/>
<nd ref="13116569241"/>
<nd ref="13116569244"/>
<nd ref="13116569242"/>
<tag k="building" v="yes"/>
<tag k="building:levels" v="2"/>
</way>
</osm>`;

// Step 2: get the bounding box data for the buiding from the API
// Paste the same data as above to get the real URL and then fetch and paste that here.
const mapData = `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="openstreetmap-cgimap 2.1.0 (383548 spike-06.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
 <bounds minlat="55.8550736" minlon="-4.3314236" maxlat="55.8551787" maxlon="-4.3312202"/>
 <node id="13623622" visible="true" version="6" changeset="80052081" timestamp="2020-01-24T20:51:06Z" user="Scarlet72" uid="9337076" lat="55.8628175" lon="-4.3046762"/>
 <node id="13623714" visible="true" version="3" changeset="79940417" timestamp="2020-01-22T22:33:00Z" user="Scarlet72" uid="9337076" lat="55.8659764" lon="-4.3147718"/>
 <node id="94612958" visible="true" version="5" changeset="139269241" timestamp="2023-07-31T19:42:24Z" user="Grove11" uid="17825808" lat="55.8616469" lon="-4.3213939"/>
 <node id="94612966" visible="true" version="6" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8639203" lon="-4.3213110"/>
 <node id="103882747" visible="true" version="3" changeset="36029934" timestamp="2015-12-18T15:22:23Z" user="crossmyloof" uid="364391" lat="55.8532929" lon="-4.3322780"/>
 <node id="130043465" visible="true" version="2" changeset="36029934" timestamp="2015-12-18T15:22:23Z" user="crossmyloof" uid="364391" lat="55.8534050" lon="-4.3330364"/>
 <node id="632243659" visible="true" version="5" changeset="112581465" timestamp="2021-10-16T14:29:26Z" user="Panthro83" uid="6016105" lat="55.8631519" lon="-4.3126164"/>
 <node id="632243660" visible="true" version="6" changeset="112581465" timestamp="2021-10-16T14:29:26Z" user="Panthro83" uid="6016105" lat="55.8627761" lon="-4.3126898"/>
 <node id="632243661" visible="true" version="6" changeset="112581465" timestamp="2021-10-16T14:29:26Z" user="Panthro83" uid="6016105" lat="55.8628173" lon="-4.3132614"/>
 <node id="632243663" visible="true" version="4" changeset="155345119" timestamp="2024-08-16T19:59:30Z" user="GinaroZ" uid="3432400" lat="55.8627846" lon="-4.3142632"/>
 <node id="633515963" visible="true" version="4" changeset="79940417" timestamp="2020-01-22T22:33:00Z" user="Scarlet72" uid="9337076" lat="55.8652468" lon="-4.3187888"/>
 <node id="988702840" visible="true" version="4" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8587012" lon="-4.3409595"/>
 <node id="988702877" visible="true" version="4" changeset="172728491" timestamp="2025-10-02T00:46:40Z" user="Grove11" uid="17825808" lat="55.8602867" lon="-4.3401757"/>
 <node id="988703066" visible="true" version="2" changeset="172728491" timestamp="2025-10-02T00:46:40Z" user="Grove11" uid="17825808" lat="55.8612662" lon="-4.3463800"/>
 <node id="988703098" visible="true" version="1" changeset="6366503" timestamp="2010-11-14T13:11:42Z" user="Central America" uid="69853" lat="55.8611938" lon="-4.3455079"/>
 <node id="988703136" visible="true" version="2" changeset="172728491" timestamp="2025-10-02T00:46:40Z" user="Grove11" uid="17825808" lat="55.8610780" lon="-4.3442520"/>
 <node id="988703196" visible="true" version="4" changeset="172728491" timestamp="2025-10-02T00:46:40Z" user="Grove11" uid="17825808" lat="55.8609082" lon="-4.3429975"/>
 <node id="988703336" visible="true" version="4" changeset="172728491" timestamp="2025-10-02T00:46:40Z" user="Grove11" uid="17825808" lat="55.8591648" lon="-4.3441917"/>
 <node id="1465309643" visible="true" version="2" changeset="156395913" timestamp="2024-09-09T13:53:28Z" user="Twentyhertz" uid="12438021" lat="55.8616040" lon="-4.3045044"/>
 <node id="1465310067" visible="true" version="2" changeset="80052081" timestamp="2020-01-24T20:51:06Z" user="Scarlet72" uid="9337076" lat="55.8614676" lon="-4.3054886"/>
 <node id="1465310530" visible="true" version="2" changeset="156395913" timestamp="2024-09-09T13:53:28Z" user="Twentyhertz" uid="12438021" lat="55.8626431" lon="-4.3046515"/>
 <node id="1465349030" visible="true" version="2" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8627233" lon="-4.3134648"/>
 <node id="1465407213" visible="true" version="3" changeset="79940417" timestamp="2020-01-22T22:33:00Z" user="Scarlet72" uid="9337076" lat="55.8649205" lon="-4.3295829"/>
 <node id="1465407298" visible="true" version="2" changeset="79940417" timestamp="2020-01-22T22:33:00Z" user="Scarlet72" uid="9337076" lat="55.8646310" lon="-4.3267583"/>
 <node id="1465407330" visible="true" version="1" changeset="9548376" timestamp="2011-10-13T16:58:48Z" user="i am tiz" uid="275749" lat="55.8649324" lon="-4.3291064"/>
 <node id="1465407352" visible="true" version="2" changeset="79940417" timestamp="2020-01-22T22:33:00Z" user="Scarlet72" uid="9337076" lat="55.8649878" lon="-4.3149995"/>
 <node id="1465407564" visible="true" version="2" changeset="79940417" timestamp="2020-01-22T22:33:00Z" user="Scarlet72" uid="9337076" lat="55.8641731" lon="-4.3267677"/>
 <node id="1465407681" visible="true" version="2" changeset="79940417" timestamp="2020-01-22T22:33:00Z" user="Scarlet72" uid="9337076" lat="55.8646544" lon="-4.3281047"/>
 <node id="1468345413" visible="true" version="2" changeset="112561340" timestamp="2021-10-15T22:09:58Z" user="Panthro83" uid="6016105" lat="55.8618398" lon="-4.3097011"/>
 <node id="1468345437" visible="true" version="2" changeset="53665713" timestamp="2017-11-10T12:44:18Z" user="sladen" uid="12671" lat="55.8610147" lon="-4.3093231"/>
 <node id="1468345453" visible="true" version="3" changeset="112561340" timestamp="2021-10-15T22:09:58Z" user="Panthro83" uid="6016105" lat="55.8610103" lon="-4.3095468"/>
 <node id="1468345475" visible="true" version="2" changeset="112561340" timestamp="2021-10-15T22:09:58Z" user="Panthro83" uid="6016105" lat="55.8614664" lon="-4.3096058"/>
 <node id="1473222635" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:01Z" user="i am tiz" uid="275749" lat="55.8630363" lon="-4.3114040"/>
 <node id="1473222639" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:01Z" user="i am tiz" uid="275749" lat="55.8620790" lon="-4.3360052"/>
 <node id="1473222644" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:01Z" user="i am tiz" uid="275749" lat="55.8606761" lon="-4.3249974"/>
 <node id="1473222646" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:01Z" user="i am tiz" uid="275749" lat="55.8543532" lon="-4.3220191"/>
 <node id="1473222648" visible="true" version="2" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8602335" lon="-4.3472866"/>
 <node id="1473222649" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:01Z" user="i am tiz" uid="275749" lat="55.8602667" lon="-4.3473241"/>
 <node id="1473222650" visible="true" version="2" changeset="155345119" timestamp="2024-08-16T19:59:30Z" user="GinaroZ" uid="3432400" lat="55.8638082" lon="-4.3105475"/>
 <node id="1473222651" visible="true" version="2" changeset="150357844" timestamp="2024-04-22T17:13:54Z" user="Grove11" uid="17825808" lat="55.8596343" lon="-4.3081026"/>
 <node id="1473222652" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:02Z" user="i am tiz" uid="275749" lat="55.8573463" lon="-4.3420241"/>
 <node id="1473222654" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:02Z" user="i am tiz" uid="275749" lat="55.8569730" lon="-4.3223903"/>
 <node id="1473222655" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:02Z" user="i am tiz" uid="275749" lat="55.8523725" lon="-4.3250618"/>
 <node id="1473222656" visible="true" version="2" changeset="20182029" timestamp="2014-01-24T18:32:52Z" user="Julian Gibson" uid="20007" lat="55.8640696" lon="-4.3349213"/>
 <node id="1473222658" visible="true" version="2" changeset="36029207" timestamp="2015-12-18T14:45:35Z" user="crossmyloof" uid="364391" lat="55.8590693" lon="-4.3387987"/>
 <node id="1473222660" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:02Z" user="i am tiz" uid="275749" lat="55.8575149" lon="-4.3418095"/>
 <node id="1473222661" visible="true" version="2" changeset="36029934" timestamp="2015-12-18T15:22:23Z" user="crossmyloof" uid="364391" lat="55.8532898" lon="-4.3322517"/>
 <node id="1473222664" visible="true" version="2" changeset="58020050" timestamp="2018-04-11T23:05:48Z" user="GinaroZ" uid="3432400" lat="55.8529322" lon="-4.3276635"/>
 <node id="1473222665" visible="true" version="3" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8642469" lon="-4.3341775"/>
 <node id="1473222667" visible="true" version="2" changeset="36029207" timestamp="2015-12-18T14:45:35Z" user="crossmyloof" uid="364391" lat="55.8589415" lon="-4.3384360"/>
 <node id="1473222668" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:02Z" user="i am tiz" uid="275749" lat="55.8592371" lon="-4.3463907"/>
 <node id="1473222669" visible="true" version="2" changeset="20182029" timestamp="2014-01-24T18:32:52Z" user="Julian Gibson" uid="20007" lat="55.8642704" lon="-4.3327737"/>
 <node id="1473222674" visible="true" version="2" changeset="155345119" timestamp="2024-08-16T19:59:30Z" user="GinaroZ" uid="3432400" lat="55.8639879" lon="-4.3101808"/>
 <node id="1473222675" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:03Z" user="i am tiz" uid="275749" lat="55.8608444" lon="-4.3092303"/>
 <node id="1473222676" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:03Z" user="i am tiz" uid="275749" lat="55.8568405" lon="-4.3219075"/>
 <node id="1473222679" visible="true" version="3" changeset="112561340" timestamp="2021-10-15T22:09:58Z" user="Panthro83" uid="6016105" lat="55.8619793" lon="-4.3097278"/>
 <node id="1473222680" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:03Z" user="i am tiz" uid="275749" lat="55.8547750" lon="-4.3200622"/>
 <node id="1473222681" visible="true" version="2" changeset="20182029" timestamp="2014-01-24T18:32:52Z" user="Julian Gibson" uid="20007" lat="55.8641538" lon="-4.3349369"/>
 <node id="1473222682" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:03Z" user="i am tiz" uid="275749" lat="55.8615612" lon="-4.3239353"/>
 <node id="1473222683" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:03Z" user="i am tiz" uid="275749" lat="55.8616512" lon="-4.3234246"/>
 <node id="1473222687" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:03Z" user="i am tiz" uid="275749" lat="55.8627112" lon="-4.3214033"/>
 <node id="1473222689" visible="true" version="3" changeset="36029207" timestamp="2015-12-18T14:45:35Z" user="crossmyloof" uid="364391" lat="55.8599002" lon="-4.3381304"/>
 <node id="1473222690" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:03Z" user="i am tiz" uid="275749" lat="55.8556539" lon="-4.3422429"/>
 <node id="1473222691" visible="true" version="2" changeset="147407369" timestamp="2024-02-13T12:39:01Z" user="GinaroZ" uid="3432400" lat="55.8556610" lon="-4.3424778"/>
 <node id="1473222696" visible="true" version="2" changeset="111964260" timestamp="2021-10-01T13:32:03Z" user="NickJOB" uid="245634" lat="55.8641930" lon="-4.3318612"/>
 <node id="1473222697" visible="true" version="3" changeset="80052081" timestamp="2020-01-24T20:51:06Z" user="Scarlet72" uid="9337076" lat="55.8612559" lon="-4.3044552"/>
 <node id="1473222700" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:04Z" user="i am tiz" uid="275749" lat="55.8525712" lon="-4.3300507"/>
 <node id="1473222703" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:04Z" user="i am tiz" uid="275749" lat="55.8637408" lon="-4.3083677"/>
 <node id="1473222705" visible="true" version="2" changeset="147407369" timestamp="2024-02-13T12:39:01Z" user="GinaroZ" uid="3432400" lat="55.8551236" lon="-4.3410467"/>
 <node id="1473222708" visible="true" version="2" changeset="36029934" timestamp="2015-12-18T15:22:23Z" user="crossmyloof" uid="364391" lat="55.8542079" lon="-4.3391400"/>
 <node id="1473222710" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:04Z" user="i am tiz" uid="275749" lat="55.8625002" lon="-4.3355911"/>
 <node id="1473222714" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8614348" lon="-4.3241284"/>
 <node id="1473222715" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8632350" lon="-4.3120906"/>
 <node id="1473222716" visible="true" version="2" changeset="36029207" timestamp="2015-12-18T14:45:35Z" user="crossmyloof" uid="364391" lat="55.8595590" lon="-4.3365517"/>
 <node id="1473222719" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8548111" lon="-4.3204377"/>
 <node id="1473222721" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8589721" lon="-4.3155453"/>
 <node id="1473222722" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8544257" lon="-4.3217573"/>
 <node id="1473222723" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8526916" lon="-4.3300936"/>
 <node id="1473222725" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8563588" lon="-4.3211780"/>
 <node id="1473222726" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8624523" lon="-4.3101594"/>
 <node id="1473222727" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8543351" lon="-4.3202918"/>
 <node id="1473222730" visible="true" version="3" changeset="36329713" timestamp="2016-01-03T00:34:55Z" user="i am tiz" uid="275749" lat="55.8598169" lon="-4.3376234"/>
 <node id="1473222732" visible="true" version="4" changeset="173894548" timestamp="2025-10-28T17:28:25Z" user="tagishsimon" uid="9198745" lat="55.8640183" lon="-4.3190457"/>
 <node id="1473222733" visible="true" version="2" changeset="174874701" timestamp="2025-11-19T19:12:17Z" user="Grove11" uid="17825808" lat="55.8640782" lon="-4.3290090"/>
 <node id="1473222735" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:05Z" user="i am tiz" uid="275749" lat="55.8632892" lon="-4.3126378"/>
 <node id="1473222736" visible="true" version="2" changeset="147407369" timestamp="2024-02-13T12:39:01Z" user="GinaroZ" uid="3432400" lat="55.8556458" lon="-4.3416525"/>
 <node id="1473222739" visible="true" version="2" changeset="147407369" timestamp="2024-02-13T12:39:01Z" user="GinaroZ" uid="3432400" lat="55.8552890" lon="-4.3410109"/>
 <node id="1473222742" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:06Z" user="i am tiz" uid="275749" lat="55.8585503" lon="-4.3155174"/>
 <node id="1473222743" visible="true" version="2" changeset="147407369" timestamp="2024-02-13T12:39:01Z" user="GinaroZ" uid="3432400" lat="55.8557659" lon="-4.3421250"/>
 <node id="1473222745" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:06Z" user="i am tiz" uid="275749" lat="55.8640355" lon="-4.3098419"/>
 <node id="1473222746" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:06Z" user="i am tiz" uid="275749" lat="55.8640174" lon="-4.3092518"/>
 <node id="1473222749" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:06Z" user="i am tiz" uid="275749" lat="55.8594057" lon="-4.3207595"/>
 <node id="1473222751" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:06Z" user="i am tiz" uid="275749" lat="55.8613625" lon="-4.3070052"/>
 <node id="1473222752" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:06Z" user="i am tiz" uid="275749" lat="55.8534619" lon="-4.3301837"/>
 <node id="1473222753" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:06Z" user="i am tiz" uid="275749" lat="55.8540283" lon="-4.3300829"/>
 <node id="1473222754" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:06Z" user="i am tiz" uid="275749" lat="55.8538055" lon="-4.3301473"/>
 <node id="1473222756" visible="true" version="2" changeset="58020050" timestamp="2018-04-11T23:05:48Z" user="GinaroZ" uid="3432400" lat="55.8523996" lon="-4.3257431"/>
 <node id="1473222757" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:07Z" user="i am tiz" uid="275749" lat="55.8604473" lon="-4.3371532"/>
 <node id="1473222760" visible="true" version="2" changeset="147407369" timestamp="2024-02-13T12:39:01Z" user="GinaroZ" uid="3432400" lat="55.8559408" lon="-4.3431304"/>
 <node id="1473222762" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:07Z" user="i am tiz" uid="275749" lat="55.8642344" lon="-4.3288169"/>
 <node id="1473222764" visible="true" version="2" changeset="36029934" timestamp="2015-12-18T15:22:23Z" user="crossmyloof" uid="364391" lat="55.8552951" lon="-4.3313397"/>
 <node id="1473222765" visible="true" version="2" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8641077" lon="-4.3134535"/>
 <node id="1473222767" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:07Z" user="i am tiz" uid="275749" lat="55.8608146" lon="-4.3290851"/>
 <node id="1473222769" visible="true" version="2" changeset="20182029" timestamp="2014-01-24T18:32:52Z" user="Julian Gibson" uid="20007" lat="55.8644857" lon="-4.3340544"/>
 <node id="1473222772" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:07Z" user="i am tiz" uid="275749" lat="55.8544016" lon="-4.3234525"/>
 <node id="1473222773" visible="true" version="2" changeset="36029934" timestamp="2015-12-18T15:22:23Z" user="crossmyloof" uid="364391" lat="55.8549584" lon="-4.3410145"/>
 <node id="1473222775" visible="true" version="2" changeset="20182029" timestamp="2014-01-24T18:32:52Z" user="Julian Gibson" uid="20007" lat="55.8637841" lon="-4.3330990"/>
 <node id="1473222776" visible="true" version="2" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8638413" lon="-4.3120326"/>
 <node id="1473222780" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:08Z" user="i am tiz" uid="275749" lat="55.8547509" lon="-4.3298039"/>
 <node id="1473222781" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:08Z" user="i am tiz" uid="275749" lat="55.8606761" lon="-4.3084106"/>
 <node id="1473222782" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:08Z" user="i am tiz" uid="275749" lat="55.8589721" lon="-4.3181739"/>
 <node id="1473222783" visible="true" version="2" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8598045" lon="-4.3475896"/>
 <node id="1473222785" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:08Z" user="i am tiz" uid="275749" lat="55.8551119" lon="-4.3296473"/>
 <node id="1473222792" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:08Z" user="i am tiz" uid="275749" lat="55.8638792" lon="-4.3128202"/>
 <node id="1473222795" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:08Z" user="i am tiz" uid="275749" lat="55.8610615" lon="-4.3061576"/>
 <node id="1473222796" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:08Z" user="i am tiz" uid="275749" lat="55.8525170" lon="-4.3256733"/>
 <node id="1473222797" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:09Z" user="i am tiz" uid="275749" lat="55.8616696" lon="-4.3145690"/>
 <node id="1473222798" visible="true" version="2" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8634698" lon="-4.3112283"/>
 <node id="1473222801" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:09Z" user="i am tiz" uid="275749" lat="55.8547145" lon="-4.3199913"/>
 <node id="1473222802" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:09Z" user="i am tiz" uid="275749" lat="55.8641742" lon="-4.3296215"/>
 <node id="1473222805" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:09Z" user="i am tiz" uid="275749" lat="55.8593033" lon="-4.3198368"/>
 <node id="1473222807" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:09Z" user="i am tiz" uid="275749" lat="55.8585386" lon="-4.3158350"/>
 <node id="1473222810" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:09Z" user="i am tiz" uid="275749" lat="55.8614766" lon="-4.3058293"/>
 <node id="1473222812" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:10Z" user="i am tiz" uid="275749" lat="55.8628377" lon="-4.3333981"/>
 <node id="1473222813" visible="true" version="2" changeset="158823793" timestamp="2024-11-06T15:44:34Z" user="crossmyloof" uid="364391" lat="55.8604644" lon="-4.3150771"/>
 <node id="1473222816" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:10Z" user="i am tiz" uid="275749" lat="55.8523484" lon="-4.3283663"/>
 <node id="1473222818" visible="true" version="2" changeset="20182029" timestamp="2014-01-24T18:32:52Z" user="Julian Gibson" uid="20007" lat="55.8646087" lon="-4.3346942"/>
 <node id="1473222819" visible="true" version="2" changeset="41166559" timestamp="2016-08-01T12:31:33Z" user="crossmyloof" uid="364391" lat="55.8620828" lon="-4.3099864"/>
 <node id="1473222820" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:10Z" user="i am tiz" uid="275749" lat="55.8549855" lon="-4.3217723"/>
 <node id="1473222821" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:10Z" user="i am tiz" uid="275749" lat="55.8622597" lon="-4.3100414"/>
 <node id="1473222822" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:10Z" user="i am tiz" uid="275749" lat="55.8628196" lon="-4.3345032"/>
 <node id="1473222824" visible="true" version="2" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8653148" lon="-4.3127695"/>
 <node id="1473222825" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:10Z" user="i am tiz" uid="275749" lat="55.8579184" lon="-4.3428395"/>
 <node id="1473222826" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:10Z" user="i am tiz" uid="275749" lat="55.8565756" lon="-4.3221114"/>
 <node id="1473222827" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:10Z" user="i am tiz" uid="275749" lat="55.8607785" lon="-4.3246970"/>
 <node id="1473222828" visible="true" version="2" changeset="172728491" timestamp="2025-10-02T00:46:40Z" user="Grove11" uid="17825808" lat="55.8610157" lon="-4.3437913"/>
 <node id="1473222832" visible="true" version="1" changeset="9601187" timestamp="2011-10-19T16:41:10Z" user="i am tiz" uid="275749" lat="55.8607665" lon="-4.3254588"/>
 <node id="2474120879" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8546069" lon="-4.3310948"/>
 <node id="2474120882" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8546637" lon="-4.3315702"/>
 <node id="2474120883" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550226" lon="-4.3309401"/>
 <node id="2474120885" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550803" lon="-4.3314130"/>
 <node id="2635519502" visible="true" version="2" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8641688" lon="-4.3336597"/>
 <node id="2635519519" visible="true" version="2" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8643840" lon="-4.3335499"/>
 <node id="3232589750" visible="true" version="3" changeset="172729538" timestamp="2025-10-02T02:02:25Z" user="Grove11" uid="17825808" lat="55.8608689" lon="-4.3429854"/>
 <node id="3826966351" visible="true" version="2" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8592436" lon="-4.3434392"/>
 <node id="3898452099" visible="true" version="1" changeset="36029207" timestamp="2015-12-18T14:45:35Z" user="crossmyloof" uid="364391" lat="55.8591534" lon="-4.3377258"/>
 <node id="3898452100" visible="true" version="1" changeset="36029207" timestamp="2015-12-18T14:45:35Z" user="crossmyloof" uid="364391" lat="55.8599936" lon="-4.3387628"/>
 <node id="3898452101" visible="true" version="2" changeset="172728491" timestamp="2025-10-02T00:46:40Z" user="Grove11" uid="17825808" lat="55.8599428" lon="-4.3382067"/>
 <node id="3898452102" visible="true" version="3" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8602007" lon="-4.3397093"/>
 <node id="3898452104" visible="true" version="2" changeset="172728491" timestamp="2025-10-02T00:46:40Z" user="Grove11" uid="17825808" lat="55.8598988" lon="-4.3383419"/>
 <node id="3898512403" visible="true" version="1" changeset="36029934" timestamp="2015-12-18T15:22:22Z" user="crossmyloof" uid="364391" lat="55.8542380" lon="-4.3393090"/>
 <node id="3898512404" visible="true" version="1" changeset="36029934" timestamp="2015-12-18T15:22:22Z" user="crossmyloof" uid="364391" lat="55.8542651" lon="-4.3394270"/>
 <node id="3898512405" visible="true" version="1" changeset="36029934" timestamp="2015-12-18T15:22:22Z" user="crossmyloof" uid="364391" lat="55.8543102" lon="-4.3395665"/>
 <node id="3898512406" visible="true" version="1" changeset="36029934" timestamp="2015-12-18T15:22:22Z" user="crossmyloof" uid="364391" lat="55.8549068" lon="-4.3409739"/>
 <node id="3898512407" visible="true" version="1" changeset="36029934" timestamp="2015-12-18T15:22:22Z" user="crossmyloof" uid="364391" lat="55.8548546" lon="-4.3409255"/>
 <node id="3898512408" visible="true" version="1" changeset="36029934" timestamp="2015-12-18T15:22:22Z" user="crossmyloof" uid="364391" lat="55.8548047" lon="-4.3408741"/>
 <node id="3898512409" visible="true" version="1" changeset="36029934" timestamp="2015-12-18T15:22:22Z" user="crossmyloof" uid="364391" lat="55.8547353" lon="-4.3407713"/>
 <node id="3898512410" visible="true" version="1" changeset="36029934" timestamp="2015-12-18T15:22:22Z" user="crossmyloof" uid="364391" lat="55.8543461" lon="-4.3399464"/>
 <node id="3898512411" visible="true" version="1" changeset="36029934" timestamp="2015-12-18T15:22:22Z" user="crossmyloof" uid="364391" lat="55.8544246" lon="-4.3398467"/>
 <node id="6452611706" visible="true" version="1" changeset="69944112" timestamp="2019-05-06T16:57:23Z" user="ravsjith" uid="8240071" lat="55.8572913" lon="-4.3220539"/>
 <node id="6477496977" visible="true" version="1" changeset="70309450" timestamp="2019-05-16T09:06:57Z" user="abbuddha" uid="9259451" lat="55.8542164" lon="-4.3391878"/>
 <node id="6788093201" visible="true" version="1" changeset="74350682" timestamp="2019-09-11T11:58:36Z" user="bathines" uid="10219386" lat="55.8535779" lon="-4.3343509"/>
 <node id="6788093208" visible="true" version="1" changeset="74350682" timestamp="2019-09-11T11:58:36Z" user="bathines" uid="10219386" lat="55.8536713" lon="-4.3350609"/>
 <node id="6821861754" visible="true" version="1" changeset="74889686" timestamp="2019-09-25T06:39:14Z" user="sekta1" uid="10255277" lat="55.8534713" lon="-4.3335405"/>
 <node id="6821861757" visible="true" version="1" changeset="74889686" timestamp="2019-09-25T06:39:14Z" user="sekta1" uid="10255277" lat="55.8533632" lon="-4.3327538"/>
 <node id="6822196897" visible="true" version="1" changeset="74897664" timestamp="2019-09-25T09:26:23Z" user="chaubean" uid="10252553" lat="55.8537590" lon="-4.3357274"/>
 <node id="6822196899" visible="true" version="1" changeset="74897664" timestamp="2019-09-25T09:26:23Z" user="chaubean" uid="10252553" lat="55.8538238" lon="-4.3362202"/>
 <node id="6946113174" visible="true" version="1" changeset="76611317" timestamp="2019-11-04T19:49:37Z" user="GinaroZ" uid="3432400" lat="55.8648361" lon="-4.3280979"/>
 <node id="7152493490" visible="true" version="2" changeset="150135852" timestamp="2024-04-17T15:38:28Z" user="Grove11" uid="17825808" lat="55.8649206" lon="-4.3289829"/>
 <node id="7156229305" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8645843" lon="-4.3134226"/>
 <node id="7156229306" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8645759" lon="-4.3134836"/>
 <node id="7156229307" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8645620" lon="-4.3135326"/>
 <node id="7156229308" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8645383" lon="-4.3136238"/>
 <node id="7156229309" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8644901" lon="-4.3136754"/>
 <node id="7156229310" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8644355" lon="-4.3137062"/>
 <node id="7156229311" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8643938" lon="-4.3137150"/>
 <node id="7156229312" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8643494" lon="-4.3137116"/>
 <node id="7156229313" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8642737" lon="-4.3136774"/>
 <node id="7156229314" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8641955" lon="-4.3136043"/>
 <node id="7156229315" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8645988" lon="-4.3134172"/>
 <node id="7156229316" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8648547" lon="-4.3132308"/>
 <node id="7156229317" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8649209" lon="-4.3131785"/>
 <node id="7156229356" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8638636" lon="-4.3122773"/>
 <node id="7156229357" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8638248" lon="-4.3124758"/>
 <node id="7156229490" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8647580" lon="-4.3132563"/>
 <node id="7156229491" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8647388" lon="-4.3132938"/>
 <node id="7156229492" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8646922" lon="-4.3133575"/>
 <node id="7156229493" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8646508" lon="-4.3133877"/>
 <node id="7156229584" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8625195" lon="-4.3143131"/>
 <node id="7156229846" visible="true" version="1" changeset="80028707" timestamp="2020-01-24T11:27:00Z" user="Scarlet72" uid="9337076" lat="55.8639245" lon="-4.3191263"/>
 <node id="7820924101" visible="true" version="1" changeset="89532926" timestamp="2020-08-17T18:16:04Z" user="alopix" uid="38183" lat="55.8617480" lon="-4.3045248"/>
 <node id="7820924102" visible="true" version="1" changeset="89532926" timestamp="2020-08-17T18:16:04Z" user="alopix" uid="38183" lat="55.8622197" lon="-4.3045916"/>
 <node id="7898084646" visible="true" version="1" changeset="90775032" timestamp="2020-09-11T19:19:36Z" user="GinaroZ" uid="3432400" lat="55.8630281" lon="-4.3113793"/>
 <node id="8347100907" visible="true" version="2" changeset="156395913" timestamp="2024-09-09T13:53:28Z" user="Twentyhertz" uid="12438021" lat="55.8652934" lon="-4.3127917"/>
 <node id="9107590969" visible="true" version="1" changeset="111444776" timestamp="2021-09-20T11:21:32Z" user="Panthro83" uid="6016105" lat="55.8624687" lon="-4.3101942"/>
 <node id="9137756616" visible="true" version="1" changeset="111964260" timestamp="2021-10-01T13:32:03Z" user="NickJOB" uid="245634" lat="55.8642150" lon="-4.3321558"/>
 <node id="9137773917" visible="true" version="1" changeset="111964260" timestamp="2021-10-01T13:32:03Z" user="NickJOB" uid="245634" lat="55.8642374" lon="-4.3325090"/>
 <node id="9175518255" visible="true" version="1" changeset="112561340" timestamp="2021-10-15T22:09:58Z" user="Panthro83" uid="6016105" lat="55.8618153" lon="-4.3096948"/>
 <node id="9176459208" visible="true" version="1" changeset="112581465" timestamp="2021-10-16T14:29:26Z" user="Panthro83" uid="6016105" lat="55.8630440" lon="-4.3126595"/>
 <node id="9176459209" visible="true" version="1" changeset="112581465" timestamp="2021-10-16T14:29:26Z" user="Panthro83" uid="6016105" lat="55.8630403" lon="-4.3126293"/>
 <node id="9203507266" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551806" lon="-4.3312120"/>
 <node id="9203507267" visible="true" version="1" changeset="113013411" timestamp="2021-10-26T23:15:17Z" user="GinaroZ" uid="3432400" lat="55.8550611" lon="-4.3301915"/>
 <node id="9203507268" visible="true" version="1" changeset="113013411" timestamp="2021-10-26T23:15:17Z" user="GinaroZ" uid="3432400" lat="55.8549864" lon="-4.3300981"/>
 <node id="9203507269" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8548091" lon="-4.3301648"/>
 <node id="9203507270" visible="true" version="1" changeset="113013411" timestamp="2021-10-26T23:15:17Z" user="GinaroZ" uid="3432400" lat="55.8547701" lon="-4.3302802"/>
 <node id="9203507271" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8548369" lon="-4.3308497"/>
 <node id="9203507272" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8545889" lon="-4.3309420"/>
 <node id="11579649468" visible="true" version="3" changeset="155345119" timestamp="2024-08-16T19:59:30Z" user="GinaroZ" uid="3432400" lat="55.8623077" lon="-4.3143700"/>
 <node id="11618530413" visible="true" version="1" changeset="147407369" timestamp="2024-02-13T12:39:01Z" user="GinaroZ" uid="3432400" lat="55.8559844" lon="-4.3431566"/>
 <node id="11618530489" visible="true" version="1" changeset="147407369" timestamp="2024-02-13T12:39:01Z" user="GinaroZ" uid="3432400" lat="55.8554488" lon="-4.3408460"/>
 <node id="11824996262" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8547249" lon="-4.3308252"/>
 <node id="11824996263" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8545813" lon="-4.3308792"/>
 <node id="11824996264" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8546606" lon="-4.3315834"/>
 <node id="11824996268" visible="true" version="1" changeset="150134594" timestamp="2024-04-17T15:11:56Z" user="Grove11" uid="17825808" lat="55.8543672" lon="-4.3399196"/>
 <node id="11825027158" visible="true" version="1" changeset="150135852" timestamp="2024-04-17T15:38:28Z" user="Grove11" uid="17825808" lat="55.8648271" lon="-4.3295877"/>
 <node id="11825033879" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8546535" lon="-4.3302233"/>
 <node id="11825033880" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8552002" lon="-4.3313836"/>
 <node id="11838323504" visible="true" version="1" changeset="150357844" timestamp="2024-04-22T17:13:54Z" user="Grove11" uid="17825808" lat="55.8598265" lon="-4.3088838"/>
 <node id="11848592016" visible="true" version="1" changeset="150516454" timestamp="2024-04-25T22:55:05Z" user="Grove11" uid="17825808" lat="55.8636758" lon="-4.3331332"/>
 <node id="11848592026" visible="true" version="1" changeset="150516454" timestamp="2024-04-25T22:55:05Z" user="Grove11" uid="17825808" lat="55.8631035" lon="-4.3333141"/>
 <node id="12318870672" visible="true" version="1" changeset="158823793" timestamp="2024-11-06T15:44:34Z" user="crossmyloof" uid="364391" lat="55.8607141" lon="-4.3149665"/>
 <node id="12520731005" visible="true" version="1" changeset="161602649" timestamp="2025-01-21T14:24:45Z" user="Grove11" uid="17825808" lat="55.8639860" lon="-4.3131162"/>
 <node id="13116569240" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551787" lon="-4.3313915"/>
 <node id="13116569241" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550939" lon="-4.3314236"/>
 <node id="13116569242" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551585" lon="-4.3312202"/>
 <node id="13116569243" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550597" lon="-4.3312569"/>
 <node id="13116569244" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550736" lon="-4.3312518"/>
 <node id="13116569245" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551741" lon="-4.3313520"/>
 <node id="13116569246" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551254" lon="-4.3313700"/>
 <node id="13116569247" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551136" lon="-4.3312685"/>
 <node id="13116569248" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551621" lon="-4.3312507"/>
 <node id="13187232721" visible="true" version="1" changeset="172728491" timestamp="2025-10-02T00:46:40Z" user="Grove11" uid="17825808" lat="55.8599429" lon="-4.3383034"/>
 <node id="13189655147" visible="true" version="1" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8601485" lon="-4.3434954"/>
 <node id="13189655167" visible="true" version="1" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8600688" lon="-4.3403157"/>
 <node id="13189655168" visible="true" version="1" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808" lat="55.8590261" lon="-4.3410198"/>
 <way id="133882078" visible="true" version="35" changeset="172767904" timestamp="2025-10-02T22:44:01Z" user="Grove11" uid="17825808">
  <nd ref="11838323504"/>
  <nd ref="1473222651"/>
  <nd ref="1473222751"/>
  <nd ref="1473222795"/>
  <nd ref="1473222810"/>
  <nd ref="1465310067"/>
  <nd ref="1473222697"/>
  <nd ref="1465309643"/>
  <nd ref="7820924101"/>
  <nd ref="7820924102"/>
  <nd ref="1465310530"/>
  <nd ref="13623622"/>
  <nd ref="1473222703"/>
  <nd ref="1473222746"/>
  <nd ref="1473222745"/>
  <nd ref="1473222674"/>
  <nd ref="1473222650"/>
  <nd ref="1473222798"/>
  <nd ref="1473222776"/>
  <nd ref="7156229356"/>
  <nd ref="7156229357"/>
  <nd ref="1473222792"/>
  <nd ref="12520731005"/>
  <nd ref="1473222765"/>
  <nd ref="7156229314"/>
  <nd ref="7156229313"/>
  <nd ref="7156229312"/>
  <nd ref="7156229311"/>
  <nd ref="7156229310"/>
  <nd ref="7156229309"/>
  <nd ref="7156229308"/>
  <nd ref="7156229307"/>
  <nd ref="7156229306"/>
  <nd ref="7156229305"/>
  <nd ref="7156229315"/>
  <nd ref="7156229493"/>
  <nd ref="7156229492"/>
  <nd ref="7156229491"/>
  <nd ref="7156229490"/>
  <nd ref="7156229316"/>
  <nd ref="7156229317"/>
  <nd ref="8347100907"/>
  <nd ref="1473222824"/>
  <nd ref="13623714"/>
  <nd ref="1465407352"/>
  <nd ref="633515963"/>
  <nd ref="1473222732"/>
  <nd ref="7156229846"/>
  <nd ref="94612966"/>
  <nd ref="1473222687"/>
  <nd ref="94612958"/>
  <nd ref="1473222683"/>
  <nd ref="1473222682"/>
  <nd ref="1473222714"/>
  <nd ref="1473222827"/>
  <nd ref="1473222644"/>
  <nd ref="1473222832"/>
  <nd ref="1473222767"/>
  <nd ref="1473222733"/>
  <nd ref="1473222762"/>
  <nd ref="1465407564"/>
  <nd ref="1465407298"/>
  <nd ref="1465407681"/>
  <nd ref="6946113174"/>
  <nd ref="7152493490"/>
  <nd ref="1465407330"/>
  <nd ref="1465407213"/>
  <nd ref="11825027158"/>
  <nd ref="1473222802"/>
  <nd ref="1473222696"/>
  <nd ref="9137756616"/>
  <nd ref="9137773917"/>
  <nd ref="1473222669"/>
  <nd ref="2635519519"/>
  <nd ref="2635519502"/>
  <nd ref="1473222665"/>
  <nd ref="1473222769"/>
  <nd ref="1473222818"/>
  <nd ref="1473222681"/>
  <nd ref="1473222656"/>
  <nd ref="1473222775"/>
  <nd ref="11848592016"/>
  <nd ref="11848592026"/>
  <nd ref="1473222812"/>
  <nd ref="1473222822"/>
  <nd ref="1473222710"/>
  <nd ref="1473222639"/>
  <nd ref="1473222757"/>
  <nd ref="1473222730"/>
  <nd ref="1473222716"/>
  <nd ref="3898452099"/>
  <nd ref="1473222667"/>
  <nd ref="1473222658"/>
  <nd ref="1473222689"/>
  <nd ref="3898452101"/>
  <nd ref="13187232721"/>
  <nd ref="3898452104"/>
  <nd ref="3898452100"/>
  <nd ref="3898452102"/>
  <nd ref="988702877"/>
  <nd ref="13189655167"/>
  <nd ref="13189655168"/>
  <nd ref="988702840"/>
  <nd ref="3826966351"/>
  <nd ref="988703336"/>
  <nd ref="13189655147"/>
  <nd ref="3232589750"/>
  <nd ref="988703196"/>
  <nd ref="1473222828"/>
  <nd ref="988703136"/>
  <nd ref="988703098"/>
  <nd ref="988703066"/>
  <nd ref="1473222649"/>
  <nd ref="1473222648"/>
  <nd ref="1473222783"/>
  <nd ref="1473222668"/>
  <nd ref="1473222825"/>
  <nd ref="1473222660"/>
  <nd ref="1473222652"/>
  <nd ref="11618530413"/>
  <nd ref="1473222760"/>
  <nd ref="1473222691"/>
  <nd ref="1473222690"/>
  <nd ref="1473222743"/>
  <nd ref="1473222736"/>
  <nd ref="11618530489"/>
  <nd ref="1473222739"/>
  <nd ref="1473222705"/>
  <nd ref="1473222773"/>
  <nd ref="3898512406"/>
  <nd ref="3898512407"/>
  <nd ref="3898512408"/>
  <nd ref="3898512409"/>
  <nd ref="3898512410"/>
  <nd ref="11824996268"/>
  <nd ref="3898512411"/>
  <nd ref="3898512405"/>
  <nd ref="3898512404"/>
  <nd ref="3898512403"/>
  <nd ref="6477496977"/>
  <nd ref="1473222708"/>
  <nd ref="6822196899"/>
  <nd ref="6822196897"/>
  <nd ref="6788093208"/>
  <nd ref="6788093201"/>
  <nd ref="6821861754"/>
  <nd ref="130043465"/>
  <nd ref="6821861757"/>
  <nd ref="103882747"/>
  <nd ref="1473222661"/>
  <nd ref="11824996264"/>
  <nd ref="13116569240"/>
  <nd ref="11825033880"/>
  <nd ref="1473222764"/>
  <nd ref="1473222785"/>
  <nd ref="1473222780"/>
  <nd ref="1473222753"/>
  <nd ref="1473222754"/>
  <nd ref="1473222752"/>
  <nd ref="1473222723"/>
  <nd ref="1473222700"/>
  <nd ref="1473222816"/>
  <nd ref="1473222664"/>
  <nd ref="1473222756"/>
  <nd ref="1473222796"/>
  <nd ref="1473222655"/>
  <nd ref="1473222772"/>
  <nd ref="1473222646"/>
  <nd ref="1473222722"/>
  <nd ref="1473222727"/>
  <nd ref="1473222801"/>
  <nd ref="1473222680"/>
  <nd ref="1473222719"/>
  <nd ref="1473222820"/>
  <nd ref="1473222725"/>
  <nd ref="1473222826"/>
  <nd ref="1473222676"/>
  <nd ref="1473222654"/>
  <nd ref="6452611706"/>
  <nd ref="1473222749"/>
  <nd ref="1473222805"/>
  <nd ref="1473222782"/>
  <nd ref="1473222807"/>
  <nd ref="1473222742"/>
  <nd ref="1473222721"/>
  <nd ref="1473222813"/>
  <nd ref="12318870672"/>
  <nd ref="1473222797"/>
  <nd ref="11579649468"/>
  <nd ref="7156229584"/>
  <nd ref="632243663"/>
  <nd ref="1465349030"/>
  <nd ref="632243661"/>
  <nd ref="632243660"/>
  <nd ref="9176459209"/>
  <nd ref="9176459208"/>
  <nd ref="632243659"/>
  <nd ref="1473222735"/>
  <nd ref="1473222715"/>
  <nd ref="1473222635"/>
  <nd ref="7898084646"/>
  <nd ref="9107590969"/>
  <nd ref="1473222726"/>
  <nd ref="1473222821"/>
  <nd ref="1473222819"/>
  <nd ref="1473222679"/>
  <nd ref="1468345413"/>
  <nd ref="9175518255"/>
  <nd ref="1468345475"/>
  <nd ref="1468345453"/>
  <nd ref="1468345437"/>
  <nd ref="1473222675"/>
  <nd ref="1473222781"/>
  <nd ref="11838323504"/>
  <tag k="landuse" v="residential"/>
  <tag k="source" v="Bing"/>
 </way>
 <way id="239629773" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340">
  <nd ref="2474120883"/>
  <nd ref="2474120879"/>
  <nd ref="2474120882"/>
  <nd ref="2474120885"/>
  <nd ref="2474120883"/>
  <tag k="building" v="commercial"/>
  <tag k="source" v="Bing"/>
 </way>
 <way id="996739515" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340">
  <nd ref="9203507266"/>
  <nd ref="9203507267"/>
  <nd ref="9203507268"/>
  <nd ref="9203507269"/>
  <nd ref="9203507270"/>
  <nd ref="9203507271"/>
  <nd ref="9203507272"/>
  <nd ref="2474120879"/>
  <nd ref="2474120883"/>
  <nd ref="13116569243"/>
  <nd ref="13116569244"/>
  <nd ref="13116569242"/>
  <nd ref="9203507266"/>
  <tag k="amenity" v="parking"/>
 </way>
 <way id="1273388728" visible="true" version="2" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340">
  <nd ref="11825033879"/>
  <nd ref="9203507269"/>
  <nd ref="9203507268"/>
  <nd ref="9203507267"/>
  <nd ref="9203507266"/>
  <nd ref="11825033880"/>
  <nd ref="13116569240"/>
  <nd ref="11824996264"/>
  <nd ref="2474120882"/>
  <nd ref="2474120879"/>
  <nd ref="9203507272"/>
  <nd ref="11824996263"/>
  <nd ref="11824996262"/>
  <nd ref="11825033879"/>
  <tag k="landuse" v="retail"/>
 </way>
 <way id="1426868383" visible="true" version="2" changeset="175381161" timestamp="2025-12-02T00:38:17Z" user="philipcullen" uid="8857">
  <nd ref="13116569242"/>
  <nd ref="13116569248"/>
  <nd ref="13116569245"/>
  <nd ref="13116569240"/>
  <nd ref="13116569241"/>
  <nd ref="13116569244"/>
  <nd ref="13116569242"/>
  <tag k="building" v="yes"/>
  <tag k="building:levels" v="2"/>
 </way>
 <way id="1426868384" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340">
  <nd ref="13116569245"/>
  <nd ref="13116569246"/>
  <nd ref="13116569247"/>
  <nd ref="13116569248"/>
  <nd ref="13116569245"/>
  <tag k="building:colour" v="lightyellow"/>
  <tag k="building:levels" v="2"/>
  <tag k="building:part" v="yes"/>
  <tag k="roof:colour" v="grey"/>
  <tag k="roof:direction" v="10"/>
  <tag k="roof:shape" v="skillion"/>
 </way>
 <way id="1426868385" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340">
  <nd ref="13116569245"/>
  <nd ref="13116569240"/>
  <nd ref="13116569241"/>
  <nd ref="13116569244"/>
  <nd ref="13116569242"/>
  <nd ref="13116569248"/>
  <nd ref="13116569247"/>
  <nd ref="13116569246"/>
  <nd ref="13116569245"/>
  <tag k="building:colour" v="lightyellow"/>
  <tag k="building:levels" v="1"/>
  <tag k="building:part" v="yes"/>
  <tag k="roof:colour" v="grey"/>
  <tag k="roof:shape" v="flat"/>
 </way>
</osm>
`;

// Describe Issue
test('Diagnose Skillion Issue', async() => {
  fetch.mockResponses(
    [initialData],    // /way/1426868383/full
    [mapData],         // /map call
  );
  let wayId = '1426868383';
  const innerData = await Building.downloadDataAroundBuilding('way', wayId);
  const building = new Building(wayId, innerData);
  expect(building.id).toBe(wayId);
  const urlBase = 'https://api.openstreetmap.org/api/0.6/';
  expect(global.fetch.mock.calls[0][0]).toBe(urlBase + 'way/' + wayId + '/full');
  expect(global.fetch.mock.calls[1][0]).toBe(urlBase + 'map?bbox=-4.3314236,55.8550736,-4.3312202,55.8551787');
  // get building part
  const parts = building.parts;
  let found = false;
  for (const part of parts){
    // Get the building part
    if (part.id === '1426868384'){
      expect(part.options.roof.height).toBe(5.284715476364045);
      found = true;
    }
  }
  expect(found).toBe(true);
});

window.printError = printError;

var errors = [];

function printError(txt) {
  errors.push[txt];
}
