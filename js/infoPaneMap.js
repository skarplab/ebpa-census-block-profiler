function infoPaneEsriThematicMap(mapElement, focusFeature, thematicLayerServiceUrl, thematicLayerLayers, thematicLayerOpacity) {
	let thematicMap = L.map(mapElement, {
		zoomControl: false,
		dragging: false,
		scrollWheelZoom: false,
		doubleClickZoom: false,
		keyboard: false,
		tap: false,
		touchZoom: false
	}).setView([0, 0], 10)
	L.esri.basemapLayer('Gray').addTo(thematicMap);
	L.esri.dynamicMapLayer({
		url: thematicLayerServiceUrl,
		layers: thematicLayerLayers,
		opacity: thematicLayerOpacity
	}).addTo(thematicMap);

	let focusFeatureLeafletFeature = L.geoJson(focusFeature, {
		interactive: false,
		color: "#121212",
		weight: 2,
		dashArray: [2, 2],
		fillOpacity: 0
	})
	focusFeatureLeafletFeature.addTo(thematicMap)
	thematicMap.fitBounds(focusFeatureLeafletFeature.getBounds())

}
