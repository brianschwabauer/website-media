

// 3rd Party
const gulp = require('gulp');
const del = require('del');
const ProgressBar = require('progress');
const mergeStream = require('merge-stream');
const batch = require('gulp-batch');
const watch = require('gulp-watch');

// Custom Imports
const { createImageScaledStream, createImageColorsStream } = require('./image-manipulations');

// Custom Variables
const mediaLocation = process.env.MEDIA_LOCATION ? process.env.MEDIA_LOCATION : './www';
const imageSrc = process.env.UPLOADED_FOLDER
	? `${mediaLocation}/${process.env.UPLOADED_FOLDER}/`
	: `${mediaLocation}/upload/`;
const imageConverted = process.env.CONVERTED_FOLDER
	? `${mediaLocation}/${process.env.CONVERTED_FOLDER}/`
	: `${mediaLocation}/img/`;
const imageSizes = [
	{
		name: 'large',
		width: 2000,
		height: 2000,
		quality: .8,
		colorCorrect: false,
		contrastEnhance: false,
		sharpen: false,
		upscale: false,
		crop: false,
	},
	{
		name: 'medium',
		width: 800,
		height: 500,
		quality: .7,
		colorCorrect: false,
		contrastEnhance: false,
		sharpen: false,
		upscale: false,
		crop: false,
	},
	{
		name: 'thumb',
		width: 400,
		height: 200,
		quality: .7,
		colorCorrect: false,
		contrastEnhance: false,
		sharpen: true,
		upscale: false,
		crop: true,
	},
	{
		name: 'icon',
		width: 128,
		height: 128,
		quality: .6,
		colorCorrect: false,
		contrastEnhance: true,
		sharpen: true,
		upscale: true,
		crop: true,
	},
	{
		name: 'micro',
		width: 36,
		height: 36,
		quality: .4,
		base64: true,
		colorCorrect: [100, 120, 100], // Change brightness, saturation, hue by percent
		contrastEnhance: true,
		sharpen: true,
		upscale: false,
		crop: false,
	}
]




gulp.task('default', (taskDone) => {
	const fileExtensions = '{jpg,jpeg,gif,png,txt,json,bmp,tga,tiff,webp,ico,svg,eps,pdf}';
	const uploadedImages = imageSrc + '**/*.' + fileExtensions;
	const deletedImages = imageConverted + 'raw/' + '**/*.' + fileExtensions;
	console.log('Watching Files...', uploadedImages);
	console.log('Watching Files...', deletedImages);


	watch(deletedImages, {
		ignoreInitial: false,
		events: ['unlink'],
		read: false,
		usePolling: false, // This needs to be true only for windows
		interval: 3000, // Only necessary with usePolling = true
		binaryInterval: 3000, // Only necessary with usePolling = true
	}, batch((events, batchDone) => {

			const rawImageNames = [];

			events
				.on('data', (file) => {
					rawImageNames.push(file.relative.split('\\').pop().split('/').pop());
				})
				.on('end', () => {
					console.log('Found Files to Delete - ', rawImageNames.join(', '));

					const imageSizesToDelete = imageSizes.map((imageSize) => imageSize.name);
					imageSizesToDelete.push('base64/micro');
					imageSizesToDelete.push('color');

					const imagesToDelete = [];
					imageSizesToDelete.forEach((imageSizeName) => {
						rawImageNames.forEach((imageName) => {
							let nameWithoutExtension = imageName.split('.');
							nameWithoutExtension.pop();
							nameWithoutExtension = nameWithoutExtension.join('.');
							nameWithoutExtension += `.${fileExtensions}`;
							imagesToDelete.push(imageConverted + imageSizeName + '/' + nameWithoutExtension);
						})
					})
					del(imagesToDelete, { force: true })
						.then(() => {
							console.log(`Finished Deleting ${imagesToDelete.length} Files`);
							batchDone();
						})

				})

	}))

	


	watch(uploadedImages, {
		ignoreInitial: false,
		events: ['add'],
		read: false,
		usePolling: false, // This needs to be true only for windows
		interval: 3000, // Only necessary with usePolling = true
		binaryInterval: 3000, // Only necessary with usePolling = true
	}, batch((events, batchDone) => {

		const rawImagePaths = [];
		const rawImageNames = [];

		events
			.on('data', (file) => {
				rawImageNames.push(file.relative);
				rawImagePaths.push(file.path);
			})
			.on('end', () => {
				console.log('Found Files to Process - ', rawImageNames.join(', '));
				let tasks = [];

				// Create the scaled versions of the image files
				for (let imageSize of imageSizes) {
					for (let imagePath of rawImagePaths) {
						tasks.push(createImageScaledStream(imagePath, imageSize, imageConverted));
					}
				}

				// Create the color JSON files
				tasks.push(createImageColorsStream(rawImagePaths, imageConverted));

				if (tasks.length > 0) {
					const year = new Date().getFullYear();

					// Add raw images to the raw folder
					tasks.push(
						gulp.src(rawImagePaths)
							.pipe(gulp.dest(imageConverted + 'raw/' + year))
					)

					const stepsPerImage = 2;
					const stepsPerBatch = 1;
					const progress = new ProgressBar('processing [:bar] :percent :etas', {
						total: (rawImagePaths.length * (imageSizes.length + stepsPerImage)) + stepsPerBatch,
						width: 80,
						clear: true,
						complete: '=',
						incomplete: '-'
					});


					return mergeStream(tasks)
						.on('data', (file) => {
							progress.tick();
						})
						.on('end', () => {
							return del(rawImagePaths, { force: true })
								.then(() => {
									progress.tick();
									console.log(`Finished Processing ${rawImageNames.length} Files`);
									batchDone();
								})
						});
				}
				batchDone();


			});

	}));
});

