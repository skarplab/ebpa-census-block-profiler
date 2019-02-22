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
			"type": "line",
			"source": 'test-source',
			"layout": {
				"line-cap": "round",
				"line-join": "round"
			},
			"paint": {
				"line-color": "black",
				"line-width": 1,
				"line-dasharray": [2, 2]
			}
		}, 'road-label-small')

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
				"fill-color": "#5E35B1",
				"fill-opacity": 0.35
			}
		}, 'building')



		map.on('click', 'cb-fill-layer', (e) => {
			// Remove initial info pane info if it's there
			if (document.getElementById('initial-info-pane-content')) {
				document.getElementById('initial-info-pane-content').remove()
			}

			let selectedCensusBlockFC = turf.featureCollection([e.features[0]])
			let selectedCensusBlockPOS = turf.pointOnFeature(selectedCensusBlockFC)
			let selectedCensusBlockBuffer = turf.buffer(selectedCensusBlockFC, 1)
			let selectedCensusBlockInfo = clickedFeatureInfo(e, 'geoid10', analysisData, 'geoid10')[0]

			let context = {
				censusBlockId: selectedCensusBlockInfo.geoid10,
				los: losScoreToGrade(parseInt(selectedCensusBlockInfo.los_gw_total_score)),
				lalos: losScoreToGrade(parseInt(selectedCensusBlockInfo.la_gw_total_score))
			}
			let html = template(context);
			document.getElementById('info-pane').innerHTML = html


			let intersectPolygons = [];
			turf.featureEach(censusBlockData, (block) => {
				if (block.properties){
					let blockProperties = [block.properties];
					let intersection = martinez.intersection(selectedCensusBlockBuffer.features[0].geometry.coordinates, block.geometry.coordinates)

					if (intersection) {
						if (intersection.length > 0) {
							let join = alasql('SELECT * FROM ? blockProperties LEFT JOIN ? analysisData ON blockProperties.geoid10 = analysisData.geoid10', [blockProperties, analysisData])
							intersectPolygons.push(turf.multiPolygon(intersection, {
								"geoid10": block.properties.geoid10,
								"totpop_2018": parseInt(join[0].totpop_2018)
							}))
						}
					}
				}
			});
			// Intersecting Census Blocks data
			let intersectPolygonsFeatureCollection = turf.featureCollection(intersectPolygons)

			// Update selected Census Bloc
			map.getSource('cb-selected-source').setData(selectedCensusBlockFC)
			// Update 10-minute Walk Isochrone
			draw10MinuteWalkIsochrone(turf.getCoord(selectedCensusBlockPOS), mapboxgl.accessToken, map, 'test-source')
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

function draw10MinuteWalkIsochrone(xy, token, map, mbsource) {
	Promise.all([d3.json(`https://api.mapbox.com/isochrone/v1/mapbox/walking/${xy[0]},${xy[1]}?contours_minutes=10&polygons=true&access_token=${token}`)])
		.then(([isochroneData]) => {
			map.getSource(mbsource).setData(isochroneData)
		})
}
