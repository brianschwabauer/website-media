

const gulp = require('gulp');
const gm = require('gulp-gm');
const imageResize = require('gulp-image-resize');
const rename = require("gulp-rename");
const base64img = require('gulp-base64-img');
const through = require('through2');
const Vibrant = require('node-vibrant');




exports.createImageScaledStream = (srcPath, imageSize, destPath) => {
	let ratio;
	let resizeOptions = {
		width: imageSize.width,
		crop: true,
		quality: imageSize.quality,
		upscale: imageSize.upscale ? imageSize.upscale : false,
		noProfile: true,
		gravity: 'Center',
	}
	if (imageSize.sharpen) {
		resizeOptions.sharpen = '.5x2.5+1.5+0';
	}

	if (imageSize.name === 'micro') {
		resizeOptions.format = 'jpg';
	}


	let stream = gulp.src(srcPath)
		.pipe(gm((gmfile) => {
			return gmfile.autoOrient();
		}))
		.pipe(gm((gmfile) => {
			return gmfile.size((err, value) => {
				ratio = Math.round((value.height / value.width) * 36) / 36;
				resizeOptions.height = imageSize.crop ? imageSize.height : Math.round(imageSize.width * ratio);
			});
		}))


	if (!srcPath.endsWith('.gif') || (imageSize.crop || imageSize.name === 'micro')) {
		stream = stream.pipe(imageResize(resizeOptions))
	}

	if (imageSize.colorCorrect) {
		stream = stream.pipe(
			gm((gmfile) =>
				// Change brightness, saturation, hue by percent
				gmfile.modulate(
					imageSize.colorCorrect[0], imageSize.colorCorrect[1], imageSize.colorCorrect[2]
				)
			))
	}
	if (imageSize.contrastEnhance) {
		stream = stream.pipe(
			gm((gmfile) => {
				// black point, gamma, white point
				return gmfile.level('5%,1,95%');
			}))
	}
	stream = stream
		.pipe(gulp.dest(destPath + imageSize.name))


	if (imageSize.base64) {
		stream = stream
			.pipe(base64img())
			.pipe(rename((path) => {
				path.extname = ".txt"
			}))
			.pipe(gulp.dest(destPath + 'base64/' + imageSize.name))
	}

	return stream;
}







exports.createImageColorsStream = (rawImagePaths, destPath) => {
	const stream = gulp.src(rawImagePaths)
		.pipe(
			through.obj((file, enc, done) => {
				Vibrant.from(file.contents).getPalette((err, palette) => {

					if (palette) {
						let colors = {
							Vibrant: {
								bg: palette.Vibrant ? palette.Vibrant.getHex() : '#ffffff',
								font: palette.Vibrant ? palette.Vibrant.getTitleTextColor() : '#000000',
							},
							LightVibrant: {
								bg: palette.LightVibrant ? palette.LightVibrant.getHex() : '#ffffff',
								font: palette.LightVibrant ? palette.LightVibrant.getTitleTextColor() : '#000000',
							},
							DarkVibrant: {
								bg: palette.DarkVibrant ? palette.DarkVibrant.getHex() : '#000000',
								font: palette.DarkVibrant ? palette.DarkVibrant.getTitleTextColor() : '#ffffff',
							},
							Muted: {
								bg: palette.Muted ? palette.Muted.getHex() : '#ffffff',
								font: palette.Muted ? palette.Muted.getTitleTextColor() : '#000000',
							},
							LightMuted: {
								bg: palette.LightMuted ? palette.LightMuted.getHex() : '#ffffff',
								font: palette.LightMuted ? palette.LightMuted.getTitleTextColor() : '#000000',
							},
							DarkMuted: {
								bg: palette.DarkMuted ? palette.DarkMuted.getHex() : '#000000',
								font: palette.DarkMuted ? palette.DarkMuted.getTitleTextColor() : '#ffffff',
							},
						}
						file.contents = new Buffer.from(JSON.stringify(colors));
						let fileName = file.path.split('.').reduce((prev, current, index, array) => {
							return index < array.length - 1 ? prev + '.' + current : prev;
						});
						file.path = fileName + '.json';
						done(null, file);
					} else {
						if (err && typeof err.path === 'string') {
							let imageName = '';
							let pathParts = err.path.split('\\');
							if (pathParts.length > 0) {
								imageName = pathParts[pathParts.length - 1];
							}
							console.log(`Can't Find Image: ${imageName}`);
						} else {
							console.log(err);
						}
						done();
					}

				});

			})
		)
		.pipe(gulp.dest(destPath + 'color'))

	return stream;
}

