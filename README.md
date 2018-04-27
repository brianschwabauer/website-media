

# Brian Schwabauer Website - Media Processing

**An image/media processor that automatically scales, crops, and analyzes uploaded images**

This can be used on it's own or in conjunction with Docker.


By default it produces 8 different file formats for the uploaded images:

* **Raw** - This is the raw uploaded image. It gets moved to the img/raw folder when done processing. This is used as a backup. ('./www/img/raw/' folder)
* **Large** - A large image - 2000x2000 px max ('./www/img/large/' folder)
* **Medium** - 800x500px max ('./www/img/medium/' folder)
* **Thumbnail** - A cropped thumbnail exactly 400x200 ('./www/img/thumb/' folder)
* **Icon** - A cropped square icon image exactly 128x128 ('./www/img/icon/' folder)
* **Micro** - A tiny image used for lazy loaded blurred images. 36x36 ('./www/img/micro/' folder)
* **Base64** - A txt file base64 representation of the image. By default, this is only used with the micro images ('./www/img/base64/' folder)
* **Color** - A JSON object with info about the color in the image. ('./www/img/color/' folder)


## How it works
Once the system is running, uploading/moving files to the './www/upload/' will trigger the processor. It will then create files in the './www/img/*' folders. Once done, it will copy the raw picture to the './www/img/raw/' folder and delete the original file. 

If at any point the system isn't running, it can simply be started up and it will find any files that are in the upload folder and process them.

To remove files, just delete the files in the './www/img/raw/' folder and it will automatically delete all the other generated files.


### How to use - Standalone

To start the file watcher, simply run gulp

```
npm run serve
```

Or if gulp is installed globally

```
gulp
```
A local file watcher will be run. Anytime a file is added to the './www/upload/' folder, it will convert the files into several different formats under the './www/img/' folder.

### How to use - Docker

To run the container, attach a volume to the srv directory

```
docker run --rm -v a:/docker:/srv media:latest
```

Environment variables can be given to specify a subfolder in the volume

```
docker run --rm -e MEDIA_LOCATION="/srv/brianschwabauer/media" -e UPLOADED_FOLDER="upload" -e CONVERTED_FOLDER="img" -v a:/docker:/srv media:latest
```

Environment Variables Available

* **MEDIA_LOCATION** - The path in the volumen where the files should be
* **UPLOADED_FOLDER** - The folder name where files should be watched
* **CONVERTED_FOLDER** - The folder name where the files should be moved/converted to.

