let source = document.getElementById('info-pane-template').innerHTML;
let template = Handlebars.compile(source);

const CENSUS_BLOCK_PBF_URL = "./data/cb_2010.pbf"
const ANALYSIS_DATA_URL = "./data/analysis_values.csv"
const CAC_PBF_URL = "./data/ral_cacs.pbf"
const SUBDIVISIONS_PBF_URL = "./data/wake_subdivisions.pbf"
const COUNCIL_DISTRICTS_PBF_URL = "./data/ral_council_districts.pbf"

mapboxgl.accessToken = "pk.eyJ1IjoicHJjcmRldmxhYiIsImEiOiJjamljNWE0Z2owMGJjM2tzM3gxYmRrNXZnIn0.exFKTScPuDEIqeY-Rv36gQ"
let map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/prcrdevlab/cjsfao9os15fc1fmuot5nthgs',
	center: [-78.638176, 35.779591],
	zoom: 13
});

Promise.all([
	d3.csv(ANALYSIS_DATA_URL, (d) => {
		return {
			area: +d.area,
			geoid10: d.geoid10,
			grade: d.grade,
			gw_score_loop_contiguous: +d.gw_score_loop_contiguous,
			la_acre_score: +d.la_acre_score,
			la_dist_score: +d.la_dist_score,
			la_exp_score: +d.la_exp_score,
			la_gw_total_score: +d.la_gw_total_score,
			la_total_score: +d.la_total_score,
			los_acre_score: +d.los_acre_score,
			los_dist_score: +d.los_dist_score,
			los_exp_score: +d.los_exp_score,
			los_gw_total_score: +d.los_gw_total_score,
			los_total_score: +d.los_total_score,
			popdensity_sqmi: +d.popdensity_sqmi,
			tothh: +d.tothh,
			totpop_2018: +d.totpop_2018,
			select_extrusion: +d.popdensity_sqmi * 0.0276752767527675
		}
	}),
	d3.buffer(CENSUS_BLOCK_PBF_URL),
	d3.buffer(CAC_PBF_URL),
	d3.buffer(SUBDIVISIONS_PBF_URL),
	d3.buffer(COUNCIL_DISTRICTS_PBF_URL)
]).then(([analysisData, censusBlockPbf, cacPbf, subdivisionsPbf, councilDistrictsPbf]) => {
	let censusBlockData = geobuf.decode(new Pbf(censusBlockPbf))
	let cacData = geobuf.decode(new Pbf(cacPbf))
	let subdivisionsData = geobuf.decode(new Pbf(subdivisionsPbf))
	let councilDistrictsData = geobuf.decode(new Pbf(councilDistrictsPbf))
	map.once('data', () => {
		///////////////////////////////////
		// CENSUS BLOCKS W/ EBPA SCORES //
		/////////////////////////////////
		map.addSource("cb-source", {
			"type": 'geojson',
			"data": censusBlockData
		})	
		map.addLayer({
			"id": "cb-fill-layer",
			"type": "fill",
			"source": "cb-source",
			// "source": {
			// 	"type": 'geojson',
			// 	"data": censusBlockData
			// },
			"layout": {},
			"paint": {
				"fill-color": "#abc123",
				"fill-opacity": 0
			}
		});
		map.on('mouseenter', 'cb-fill-layer', (e) => {
			map.getCanvas().style.cursor = 'pointer'
		})
		map.on('mouseleave', 'cb-fill-layer', (e) => {
			map.getCanvas().style.cursor = 'grab'
		})
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

		// map.addLayer({
		// 	"id": "cb-selected-fill-layer",
		// 	"type": "fill",
		// 	"source": "cb-selected-source",
		// 	"layout": {},
		// 	"paint": {
		// 		"fill-color": "green",
		// 		"fill-opacity": 0.35
		// 	}
		// }, 'building')
		map.addLayer({
			"id": "cb-selected-line-layer",
			"type": "line",
			"source": "cb-selected-source",
			"layout": {},
			"paint": {
				"line-color": "#1eded2",
				"line-width": 2
			}
		})

		////////////////
		// ISOCHRONE //
		//////////////
		map.addSource("isochrone-source", {
			"type": 'geojson',
			"data": turf.featureCollection([])
		})

		// map.addLayer({
		// 	"id": "isochrone-fill-layer",
		// 	"type": "fill",
		// 	"source": 'isochrone-source',
		// 	"layout": {},
		// 	"paint": {
		// 		"fill-color": "#5E35B1",
		// 		"fill-opacity": 0.35
		// 	}
		// }, 'building')
		map.addLayer({
			"id": "isochrone-line-layer",
			"type": "line",
			"source": 'isochrone-source',
			"layout": {},
			"paint": {
				"line-color": "#121212",
				"line-width": 1,
				"line-dasharray": [2, 2]
			}
		}, 'road-label-small')

		//////////////
		// BUFFFER //
		////////////
		map.addSource("buffer-source", {
			"type": 'geojson',
			"data": turf.featureCollection([])
		})

		// map.addLayer({
		// 	"id": "buffer-line-layer",
		// 	"type": "line",
		// 	"source": "buffer-source",
		// 	"layout": {},
		// 	"paint": {
		// 		"line-color": "#121212",
		// 		"line-width": 2,
		// 		"line-dasharray": [4, 4]
		// 	}
		// })

		map.addSource("nearby-census-blocks-source", {
			"type": 'geojson',
			"data": turf.featureCollection([])
		})

		map.addLayer({
			"id": "nearby-census-blocks-fill-layer",
			"type": "fill",
			"source": "nearby-census-blocks-source",
			"layout": {},
			"paint": {
				"fill-color": [
					'match',
					['get', 'grade'],
					'A', '#1a9641',
					'B', '#a6d96a',
					'C',  '#ffffbf',
					'D',  '#fdae61',
					'F', '#d7191c',
							'#121212'
				],
				"fill-opacity": 0.5
			}
		}, 'waterway-river-canal')

	})
	
	map.on('click', 'cb-fill-layer', (e) => {
		updateApp(e)
	})
	// TODO: Use URL hash to open map with a particular Census Block already selected
	function updateApp(e) {

		removeClassFromElement(document.getElementById("toggle-view-button"), "hide")

		let selectedCensusBlockFC = turf.featureCollection([e.features[0]])
		let selectedCensusBlockInfo = clickedFeatureInfo(e, 'geoid10', analysisData, 'geoid10')[0]
		console.log(selectedCensusBlockInfo)
		selectedCensusBlockFC.features[0].properties.select_extrusion = selectedCensusBlockInfo.select_extrusion

		// TODO: BUFFER CENSUS BLOCK POLYGON AND GET INFORMATION ABOUT SURROUNDING CENSUS BLOCKS. NAMELY THIS WOULD BE USED TO FIND THE AVERAGE SCORE OF THE SURROUNDING CENSUS BLOCKS TO USE FOR COMPARISON TO THE SELECTED CENSUS BLOCK. This works but needs to be cleaned up. Some functions probably need to be refactored to make this work well.
		let selectedCensusBlockBuffer = turf.buffer(selectedCensusBlockFC, 1, {units: "miles"})
		map.getSource('buffer-source').setData(selectedCensusBlockBuffer)
		map.fitBounds(turf.bbox(selectedCensusBlockBuffer), {
			padding: 10
		})

		let intersectPolygonsFeatureCollection = intersectingPolygons(selectedCensusBlockBuffer, censusBlockData)
		let intersectingPolygonInfos = []
		turf.featureEach(intersectPolygonsFeatureCollection, (f) => {
			// console.log(clickedFeatureInfo(f, 'geoid10', analysisData, 'geoid10'))
			let fProperties = [f.properties];

			let fEnrichedFeature = turf.feature(f.geometry,
				alasql(`SELECT * FROM ? fProperties JOIN ? analysisData ON fProperties.geoid10 = analysisData.geoid10`, [fProperties, analysisData])[0])
			fEnrichedFeature.properties.grade = losScoreToGrade(parseInt(fEnrichedFeature.properties.los_gw_total_score))
			intersectingPolygonInfos.push(fEnrichedFeature)
		})
		let intersectingPolygonsEnriched = turf.featureCollection(intersectingPolygonInfos)
		console.log(intersectingPolygonsEnriched)
		map.getSource('nearby-census-blocks-source').setData(intersectingPolygonsEnriched)

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
				// map.fitBounds(turf.bbox(res), {
				// 	padding: 10
				// })
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
		mapboxReverseGeocode(selectedCensusBlockPOSCoordinates, mapboxgl.accessToken)
			.then((res) => {
				let addressBasic = ''
				if (res.features[0].address) {
					addressBasic += `${res.features[0].address} `
				}
				if (res.features[0].text) {
					addressBasic += `${res.features[0].text}`
				}

				try {
					updateHandlebarElement('info-pane', template, {
						censusBlockId: selectedCensusBlockInfo.geoid10,
						censusBlockAddress: addressBasic,
						los: losScoreToGrade(parseInt(selectedCensusBlockInfo.los_gw_total_score)),
						lalos: losScoreToGrade(parseInt(selectedCensusBlockInfo.la_gw_total_score)),
						cac: () => {
							if(!cac) {
								return "-"
							} else {
								return cac.NAME
							}
						},
						subdivision: () => {
							if (!subdivision) {
								return "-"
							} else {
								return subdivision.NAME;
							}
						},
						council: () => {
							if (!council) {
								return "-"
							} else {
								return `District ${council.COUNCIL_DIST} - ${council.COUNCIL_PERSON}`
							}
						}
					})
				} catch (e) {
					console.log(e)
				} finally {
					let chartLabels = ['Distance', 'Acre', 'Experience', 'Greenway']
					let barColors = ["#9C27B0", "#FFC107", "#2196F3", "#4CAF50"]
					ebpaScoreBarChart('los-chart',
													  chartLabels,
														[
															selectedCensusBlockInfo.los_dist_score,
															selectedCensusBlockInfo.los_acre_score,
															selectedCensusBlockInfo.los_exp_score,
															selectedCensusBlockInfo.gw_score_loop_contiguous
														],
														barColors,
														'Individual Factor Scores'
													)
					ebpaScoreBarChart('la-chart',
													  chartLabels,
														[
															selectedCensusBlockInfo.la_dist_score,
															selectedCensusBlockInfo.la_acre_score,
															selectedCensusBlockInfo.la_exp_score,
															selectedCensusBlockInfo.gw_score_loop_contiguous
														],
														barColors,
														'Individual Factor Scores'
													)
				}




				// ADD MAPS TO INFO PANE
				// Zoning
				infoPaneEsriThematicMap('zoning-map', selectedCensusBlockFC, 'https://maps.raleighnc.gov/arcgis/rest/services/Planning/Zoning/MapServer', [0], 0.4, true, ['ZONING'])
				// Future Land Use
				infoPaneEsriThematicMap('flu-map', selectedCensusBlockFC, 'https://maps.raleighnc.gov/arcgis/rest/services/Planning/FutureLandUse/MapServer', [0], 0.4, true, ['Land_Use'])
				// Greenway
				infoPaneEsriThematicMap('greenway-map', selectedCensusBlockFC, 'https://maps.raleighnc.gov/arcgis/rest/services/Parks/Greenway/MapServer', [0,1,3], 0.4, true, ['LOCATION', 'CORRIDOR'])
				// Flood Plain
				infoPaneEsriThematicMap('flood-map', selectedCensusBlockFC, 'https://maps.wakegov.com/arcgis/rest/services/Environmental/FloodData/MapServer', [0], 0.4, true, ['ZONE_IMAPS'])
			})
	}
})

function removeClassFromElement(element, className) {
	try {
		element.classList.remove(className)
	} catch(error) {
		console.log(error)
	}
}

let extrusion = false;
let toggleViewButton = document.getElementById('toggle-view-button');
let toggleViewButtonIcon = document.getElementById('toggle-view-button-icon');

document.addEventListener('DOMContentLoaded', () => {
	M.Tooltip.init(toggleViewButton)
})
toggleViewButton.addEventListener('click', () => {
	if (map.getLayer("nearby-census-blocks-fill-layer")){
		map.removeLayer("nearby-census-blocks-fill-layer")
	}
	if (map.getLayer("cb-selected-line-layer")) {
		map.removeLayer("cb-selected-line-layer")
	}

	if(!extrusion){
		map.easeTo({'pitch': 45})
		map.addLayer({
			"id": "nearby-census-blocks-fill-layer",
			"type": "fill-extrusion",
			"source": "nearby-census-blocks-source",
			"layout": {},
			"paint": {
				"fill-extrusion-color": [
					'match',
					['get', 'grade'],
					'A', '#1a9641',
					'B', '#a6d96a',
					'C', '#ffffbf',
					'D', '#fdae61',
					'F', '#d7191c',
					'#121212'
				],
				"fill-extrusion-opacity": 1,
				"fill-extrusion-height": ['get', 'select_extrusion']
			}
		})

		map.addLayer({
			"id": "cb-selected-line-layer",
			"type": "fill-extrusion",
			"source": "cb-selected-source",
			"layout": {},
			"paint": {
				"fill-extrusion-color": "#1eded2","fill-extrusion-height": ['get', 'select_extrusion'],
				"fill-extrusion-base": 0
			}
		})

		toggleViewButtonIcon.innerHTML = 'map';
	} else if(extrusion) {
		map.easeTo({ 'bearing':0, 'pitch': 0 })
		map.addLayer({
			"id": "nearby-census-blocks-fill-layer",
			"type": "fill",
			"source": "nearby-census-blocks-source",
			"layout": {},
			"paint": {
				"fill-color": [
					'match',
					['get', 'grade'],
					'A', '#1a9641',
					'B', '#a6d96a',
					'C', '#ffffbf',
					'D', '#fdae61',
					'F', '#d7191c',
					'#121212'
				],
				"fill-opacity": 0.5
			}
		}, 'waterway-river-canal')

		map.addLayer({
			"id": "cb-selected-line-layer",
			"type": "line",
			"source": "cb-selected-source",
			"layout": {},
			"paint": {
				"line-color": "#1eded2",
				"line-width": 2
			}
		})
		toggleViewButtonIcon.innerHTML = 'language';
	}
	extrusion = !extrusion
})

function mapboxReverseGeocode(coordinates, token) {
	return d3.json(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${token}`)
}



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

function losScoreToColor(score) {
	return score >  16 ? '#1a9641' :
				 score >  12 ? '#a6d96a' :
				 score >  8  ? '#ffffbf' :
				 score >  4  ? '#fdae61' :
				 score == 4  ? '#d7191c' :
											 '#121212';
}
