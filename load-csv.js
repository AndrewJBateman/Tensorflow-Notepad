const fs = require('fs');
const _ = require('lodash');

// library to shuffle an array of records
const shuffleSeed = require('shuffle-seed');

function extractColumns(data, columnNames) {
	const headers = _.first(data);

	const indexes = _.map(columnNames, (column) => headers.indexOf(column));
	const extracted = _.map(data, (row) => _.pullAt(row, indexes));

	return extracted;
}

function loadCSV(
	filename,
	{
		dataColumns = [],
		labelColumns = [],
		converters = {},
		shuffle = true,
		splitTest = false,
	}
) {
	let data = fs.readFileSync(filename, { encoding: 'utf-8' });

	data = _.map(data.split('\n'), (d) => d.split(','));
	data = _.dropRightWhile(data, (val) => _.isEqual(val, ['']));

	const headers = _.first(data);

	data = _.map(data, (row, index) => {
		if (index === 0) {
			return row;
		}
		return _.map(row, (element, index) => {
			if (converters[headers[index]]) {
				const converted = converters[headers[index]](element);
				return _.isNaN(converted) ? element : converted;
			}

			const result = parseFloat(element.replace('"', ''));
			return _.isNaN(result) ? element : result;
		});
	});

	let labels = extractColumns(data, labelColumns);
	data = extractColumns(data, dataColumns);

	data.shift();
	labels.shift();

	// shuffle and splitTest are booleans
	if (shuffle) {
		data = shuffleSeed.shuffle(data, 'phrase');
		labels = shuffleSeed.shuffle(labels, 'phrase');
	}

	if (splitTest) {
		const trainSize = _.isNumber(splitTest)
			? splitTest
			: Math.floor(data.length / 2);

		return {
			features: data.slice(0, trainSize), // gives all data from train size to end of array
			labels: labels.slice(0, trainSize),
			testFeatures: data.slice(trainSize), // gives all data from 0 to trainsize
			testLabels: labels.slice(trainSize),
		};
	} else {
		return { features: data, labels };
	}
}
// destructuring used below
const { features, labels, testFeatures, testLabels } = loadCSV('data.csv', {
	dataColumns: ['height', 'value'],
	labelColumns: ['passed'],
	shuffle: true,
	splitTest: false,
	converters: {
		passed: (val) => (val === 'TRUE' ? 1 : 0),
	},
});

console.log('Features', features);
console.log('Labels', labels);
console.log('testFeatures', testFeatures);
console.log('testLabels', testLabels);
