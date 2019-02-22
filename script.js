const WALKSCORE_KEY = "9a519f604b6775c5c4dfbde19d64fd75"

let source = document.getElementById('info-pane-template').innerHTML;
let template = Handlebars.compile(source);

const CENSUS_BLOCK_DATA_URL = "./data/cb_2010.geojson"
const ANALYSIS_DATA_URL = "./data/analysis_values.csv"

mapboxgl.accessToken = "pk.eyJ1IjoicHJjcmRldmxhYiIsImEiOiJjamljNWE0Z2owMGJjM2tzM3gxYmRrNXZnIn0.exFKTScPuDEIqeY-Rv36gQ"

let map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/prcrdevlab/cjsfao9os15fc1fmuot5nthgs',
	center: [-78.638176, 35.779591],
	zoom: 13
});



Promise.all([
	d3.json(CENSUS_BLOCK_DATA_URL),
	d3.csv(ANALYSIS_DATA_URL)
]).then(([censusBlockData, analysisData]) => {
	map.on('load', () => {
		map.addSource("test-source", {
			"type": 'geojson',
			"data": turf.featureCollection([])
		})

		map.addLayer({
			"id": "test-layer",
			"type": "fill",
			"source": 'test-source',
			"layout": {},
			"paint": {
				"fill-color": "#5E35B1",
				"fill-opacity": 0.35
			}
		}, 'building')

		map.addSource("cb-source", {
			"type": 'vector',
			"url": 'mapbox://prcrdevlab.cjn0pbmap00db2vo6ifjy5q91-5wxgw'
		})

		map.addLayer({
			"id": "cb-fill-layer",
			"type": "fill",
			// "source": "cb-source",
			"source": {
				"type": 'geojson',
				"data": censusBlockData
			},
			// "source-layer": 'Raleigh_Plus_Census_Blocks_2010',
			"layout": {},
			"paint": {
				"fill-color": "#121212",
				"fill-opacity": 0
			}
		});

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
					map.getSource('test-source').setData(res)
				})

			getWalkScore(selectedCensusBlockPOSCoordinates[1], selectedCensusBlockPOSCoordinates[0], WALKSCORE_KEY)
			// UPDATE INFO PANE
			// Remove initial info pane info if it's there
			removeElementById('initial-info-pane-content')
			// Update elements of the info pane
			updateHandlebarElement('info-pane', template, {
				censusBlockId: selectedCensusBlockInfo.geoid10,
				los: losScoreToGrade(parseInt(selectedCensusBlockInfo.los_gw_total_score)),
				lalos: losScoreToGrade(parseInt(selectedCensusBlockInfo.la_gw_total_score))
			})
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

// TODO: Gotta figure out how to work with this http resource
function getWalkScore(lat, lng, api_key) {
	let url = `http://api.walkscore.com/score?format=json&lat=${lat}&lon=${lng}&transit=1&bike=1&wsapikey=${api_key}`
	console.log(url)
	return d3.json(url, {
		crossOrigin: "anonymous",
		mode: 'no-cors'
	})
}