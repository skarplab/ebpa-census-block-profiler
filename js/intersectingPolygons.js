function intersectingPolygons(inputFeature, evaluationFeatures) {
	let intersectingFeatures = [];
	turf.featureEach(evaluationFeatures, (f) => {
		let fProperties = f.properties;
		let intersection = martinez.intersection(inputFeature.features[0].geometry.coordinates, f.geometry.coordinates)

		if (intersection && intersection.length > 0) {
			intersectingFeatures.push(turf.multiPolygon(intersection, fProperties))
		}
	})
	return turf.featureCollection(intersectingFeatures)
}