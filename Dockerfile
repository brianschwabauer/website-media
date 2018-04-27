

FROM node:9-alpine
LABEL version="1.0.0"


# GraphicsMagick Installation
# Install dependencies + gm sources
RUN apk add --update g++ gcc make wget libjpeg-turbo-dev libpng-dev libtool libgomp freetype-dev
RUN wget http://ftp.icm.edu.pl/pub/unix/graphics/GraphicsMagick/1.3/GraphicsMagick-1.3.25.tar.gz
# Unzip + compile
RUN tar zxvf GraphicsMagick-1.3.25.tar.gz
RUN cd GraphicsMagick-1.3.25 && ./configure && make && make install
# Cleanup
RUN rm -rf GraphicsMagick-*
RUN apk del g++ gcc make wget



WORKDIR /app

COPY ./package*.json ./
RUN npm install -g gulp
RUN npm install
COPY ./*.js ./

CMD [ "npm", "run",  "serve" ]
