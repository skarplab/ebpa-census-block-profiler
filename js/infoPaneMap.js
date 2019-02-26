function infoPaneEsriThematicMap(mapElement, focusFeature, thematicLayerServiceUrl, thematicLayerLayers, thematicLayerOpacity, dragging=true, popup=false) {
	let thematicMap = L.map(mapElement, {
		zoomControl: false,
		dragging: dragging,
		scrollWheelZoom: false,
		doubleClickZoom: false,
		keyboard: false,
		tap: false,
		touchZoom: false
	}).setView([0, 0], 10)
	L.esri.basemapLayer('Gray').addTo(thematicMap);
	let thematicLayer = L.esri.dynamicMapLayer({
		url: thematicLayerServiceUrl,
		layers: thematicLayerLayers,
		opacity: thematicLayerOpacity
	});
	thematicLayer.addTo(thematicMap);

	let focusFeatureLeafletFeature = L.geoJson(focusFeature, {
		interactive: false,
		color: "#121212",
		weight: 2,
		dashArray: [2, 2],
		fillOpacity: 0
	})
	focusFeatureLeafletFeature.addTo(thematicMap)

	if (popup) {
		thematicLayer.bindPopup((error, featureCollection) => {
			if (error || featureCollection.features.length === 0) {
				return false;
			} else {
				return simplePropertiesPopup(featureCollection.features[0], properties=popup)
			}
		}), {
			autoPan: false
		}
	}

	thematicMap.fitBounds(focusFeatureLeafletFeature.getBounds())

}

function simplePropertiesPopup(feature, properties) {
  let featureProperties = feature.properties;
  let popupHtml = "";
  for (let property in featureProperties) {
		if (properties === 'all'){
			if (featureProperties[property] !== null) {
				popupHtml += `<b>${property}:</b> ${featureProperties[property]}<br>`;
			}
		} else if (Array.isArray(properties)) {
			if (properties.includes(property)) {
				popupHtml += `<b>${property}:</b> ${featureProperties[property]}<br>`;
			}
		}
  }
  return popupHtml
}
