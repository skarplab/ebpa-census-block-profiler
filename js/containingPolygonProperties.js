function containingPolygonProperties(point, polygons) {
	let featureProperties;
	turf.featureEach(turf.flatten(polygons), (feature) => {
		if (turf.booleanWithin(point, feature)) {
			featureProperties = feature.properties
		}
	})
	return featureProperties
}
