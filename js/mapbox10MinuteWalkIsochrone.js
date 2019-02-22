function mapbox10MinuteWalkIsochrone(coordinates, token) {
	return d3.json(`https://api.mapbox.com/isochrone/v1/mapbox/walking/${coordinates[0]},${coordinates[1]}?contours_minutes=10&polygons=true&access_token=${token}`)
}