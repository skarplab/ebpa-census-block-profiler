const CENSUS_BLOCK_DATA_URL = "./data/cb_2010.geojson"

mapboxgl.accessToken = "pk.eyJ1IjoicHJjcmRldmxhYiIsImEiOiJjamljNWE0Z2owMGJjM2tzM3gxYmRrNXZnIn0.exFKTScPuDEIqeY-Rv36gQ"

let map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v9',
	center: [-78.638176, 35.779591],
	zoom: 13
});



Promise.all([
	d3.json(CENSUS_BLOCK_DATA_URL)
]).then(([censusBlockData]) => {
	map.on('load', () => {
		map.addSource("test-source", {
			"type": 'geojson',
			"data": turf.featureCollection([])
		})

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
				"fill-opacity": 0.2
			}
		});

		map.addLayer({
			"id": "test-layer",
			"type": "line",
			"source": 'test-source',
			"layout": {},
			"paint": {
				"line-color": "red",
				"line-width": 2
			}
		})

		map.on('click', 'cb-fill-layer', (e) => {
			let buffer = turf.buffer(turf.featureCollection([e.features[0]]), 1)
			map.getSource('test-source').setData(buffer)
			// turf.intersects() is not a viable option here.
		})

	})
})
