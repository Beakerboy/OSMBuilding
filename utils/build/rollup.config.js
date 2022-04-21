let builds = [
	{
		input: 'src/BeakerboyGeometries.js',
		output: [
			{
				format: 'umd',
				name: 'THREE',
				file: 'build/beakerboygeometries.js',
				indent: '\t'
			}
		]
	}
];


if ( process.env.ONLY_MODULE === 'true' ) {

	builds = builds[ 0 ];

}

export default builds;
