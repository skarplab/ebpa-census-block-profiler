let source = document.getElementById('info-pane-template').innerHTML;
let template = Handlebars.compile(source);

const CENSUS_BLOCK_DATA_URL = "./data/cb_2010.geojson"
const ANALYSIS_DATA_URL = "./data/analysis_values.csv"
const CAC_DATA_URL = "./data/ral_cacs.geojson"
const SUBDIVISIONS_URL = "./data/wake_subdivisions.geojson"
const COUNCIL_DISTRICTS_URL = "./data/ral_council_districts.geojson"

mapboxgl.accessToken = "pk.eyJ1IjoicHJjcmRldmxhYiIsImEiOiJjamljNWE0Z2owMGJjM2tzM3gxYmRrNXZnIn0.exFKTScPuDEIqeY-Rv36gQ"

let map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/prcrdevlab/cjsfao9os15fc1fmuot5nthgs',
	center: [-78.638176, 35.779591],
	zoom: 13
});



Promise.all([
	d3.json(CENSUS_BLOCK_DATA_URL),
	d3.csv(ANALYSIS_DATA_URL),
	d3.json(CAC_DATA_URL),
	d3.json(SUBDIVISIONS_URL),
	d3.json(COUNCIL_DISTRICTS_URL)
]).then(([censusBlockData, analysisData, cacData, subdivisionsData, councilDistrictsData]) => {

	// map.on('load', () => {
	if (map.loaded()) {
		///////////////////////////////////
		// CENSUS BLOCKS W/ EBPA SCORES //
		/////////////////////////////////
		map.addLayer({
			"id": "cb-fill-layer",
			"type": "fill",
			// "source": "cb-source",
			"source": {
				"type": 'geojson',
				"data": censusBlockData
			},
			"layout": {},
			"paint": {
				"fill-color": "#abc123",
				"fill-opacity": 0
			}
		});

		///////////
		// CACs //
		/////////
		map.addSource("cac-source", {
			"type": 'geojson',
			"data": cacData
		})

		map.addLayer({
			"id": "cac-fill-layer",
			"type": "fill",
			"source": "cac-source",
			"layout": {},
			"paint": {
				"fill-color": "#0f8ba1",
				"fill-opacity": 0
			}
		})

		//////////////////
		// SUBDIVSIONS //
		////////////////
		map.addSource("subdivisions-source", {
			"type": 'geojson',
			"data": subdivisionsData
		})

		map.addLayer({
			"id": "subdivisions-fill-layer",
			"type": "fill",
			"source": "subdivisions-source",
			"layout": {},
			"paint": {
				"fill-color": "#c3018d",
				"fill-opacity": 0
			}
		})

		////////////////////////
		// COUNCIL DISTRICTS //
		//////////////////////
		map.addSource("council-districts-source", {
			"type": 'geojson',
			"data": councilDistrictsData
		})

		map.addLayer({
			"id": "council-distrcts-fill-layer",
			"type": "fill",
			"source": "council-districts-source",
			"layout": {},
			"paint": {
				"fill-color": "#8ec30b",
				"fill-opacity": 0
			}
		})

		////////////////////////////
		// SELECTED CENSUS BLOCK //
		//////////////////////////
		map.addSource("cb-selected-source", {
			"type": 'geojson',
			"data": turf.featureCollection([])
		})

		map.addLayer({
			"id": "cb-selected-fill-layer",
			"type": "fill",
			"source": "cb-selected-source",
			"layout": {},
			"paint": {
				"fill-color": "green",
				"fill-opacity": 0.35
			}
		}, 'building')

		////////////////
		// ISOCHRONE //
		//////////////
		map.addSource("isochrone-source", {
			"type": 'geojson',
			"data": turf.featureCollection([])
		})

		map.addLayer({
			"id": "isochrone-fill-layer",
			"type": "fill",
			"source": 'isochrone-source',
			"layout": {},
			"paint": {
				"fill-color": "#5E35B1",
				"fill-opacity": 0.35
			}
		}, 'building')
		map.addLayer({
			"id": "isochrone-line-layer",
			"type": "line",
			"source": 'isochrone-source',
			"layout": {},
			"paint": {
				"line-color": "#5E35B1",
				"line-width": 2
			}
		}, 'road-label-small')
	}


	map.on('click', 'cb-fill-layer', (e) => {

		let selectedCensusBlockFC = turf.featureCollection([e.features[0]])
		let selectedCensusBlockInfo = clickedFeatureInfo(e, 'geoid10', analysisData, 'geoid10')[0]


		// TODO: BUFFER CENSUS BLOCK POLYGON AND GET INFORMATION ABOUT SURROUNDING CENSUS BLOCKS. NAMELY THIS WOULD BE USED TO FIND THE AVERAGE SCORE OF THE SURROUNDING CENSUS BLOCKS TO USE FOR COMPARISON TO THE SELECTED CENSUS BLOCK
		// let selectedCensusBlockBuffer = turf.buffer(selectedCensusBlockFC, 1)
		// let intersectPolygonsFeatureCollection = intersectingPolygons(selectedCensusBlockBuffer, censusBlockData)
		// map.getSource('cb-selected-source').setData(intersectPolygonsFeatureCollection)

		// UPDATE SELECTED CENSUS BLOCK
		map.getSource('cb-selected-source').setData(selectedCensusBlockFC)

		// UPDATE 10-MINUTE WALK ISOCHRONE
		// Get a point on surface of selected Census Block
		let selectedCensusBlockPOS = turf.pointOnFeature(selectedCensusBlockFC)
		// Get the coordinates of the point on surface
		let selectedCensusBlockPOSCoordinates = turf.getCoord(selectedCensusBlockPOS)
		// Request isochrone from Mapbox Directions API. When it is returned, set data on appropriate sources.
		mapbox10MinuteWalkIsochrone(selectedCensusBlockPOSCoordinates, mapboxgl.accessToken)
		.then((res) => {
			map.getSource('isochrone-source').setData(res)
		})

		// FIND CAC
		let cac = containingPolygonProperties(selectedCensusBlockPOS, cacData)

		// FIND SUVDIVISION
		let subdivision = containingPolygonProperties(selectedCensusBlockPOS, subdivisionsData)

		// FIND CITY COUNCIL DISTRICT
		let council = containingPolygonProperties(selectedCensusBlockPOS, councilDistrictsData);

		// UPDATE INFO PANE
		// Remove initial info pane info if it's there
		removeElementById('initial-info-pane-content')
		// Update elements of the info pane
		updateHandlebarElement('info-pane', template, {
			censusBlockId: selectedCensusBlockInfo.geoid10,
			los: losScoreToGrade(parseInt(selectedCensusBlockInfo.los_gw_total_score)),
			lalos: losScoreToGrade(parseInt(selectedCensusBlockInfo.la_gw_total_score)),
			cac: cac.NAME,
			subdivision: () => {
				if (!subdivision) {
					return ""
				} else {
					return subdivision.NAME;
				}
			},
			council: `District ${council.COUNCIL_DIST} - ${council.COUNCIL_PERSON}`
		})
	})
})

function clickedFeatureInfo(selectedFeature, selectedFeatureId, joinTable, joinTableId) {
	let selectedFeatureArray = [selectedFeature.features[0].properties]
	return alasql(`SELECT * FROM ? selectedFeatureArray JOIN ? joinTable ON selectedFeatureArray.${selectedFeatureId} = joinTable.${joinTableId}`, [selectedFeatureArray, joinTable])

}

function losScoreToGrade(score) {
	return score >  16 ? 'A' :
				 score >  12 ? 'B' :
				 score >  8  ? 'C' :
				 score >  4  ? 'D' :
				 score == 4  ? 'F' :
											 '-';
}
