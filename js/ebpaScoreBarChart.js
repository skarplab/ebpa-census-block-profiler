function ebpaScoreBarChart(el, labels, data, barColors, titleText) {
	intData = data.map(x => parseInt(x))
	const chartElement = document.getElementById(el).getContext('2d');
	const barChart = new Chart(chartElement, {
		type: 'bar',
		data: {
			labels: labels,
			datasets:[{
				data: intData,
				backgroundColor: barColors
			}]
		},
		options: {
			maintainAspectRatio: false,
			title: {
				display: true,
				text: titleText,
				fontColor: "#ffffff"
			},
			labels: {
				fontColor: "#ffffff"
			},
			legend: {
				display: false,
			},
			scales: {
				yAxes: [{
					gridLines: {
						display: false
					},
					ticks: {
						beginAtZero: true,
						fontColor: "#fff",
						fontSize: 10,
						max: 5,
						min: 0,
						stepSize: 1,
						drawTicks: false
					}
				}],
				xAxes: [{
					gridLines: {
						display: false
					},
					ticks: {
						fontColor: "#fff",
						fontSize: 10,
						lineWidth: 0
					}
				}]
			}
		}
	})
}
