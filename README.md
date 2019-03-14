# Ziparound

Find ZIP codes around a certain ZIP code, within a circle of N kilometers radius. France only, for now.

## Install

    yarn install

Get https://framagit.org/phyks/Flatisfy/blob/master/flatisfy/data_files/laposte.json and put it in ./

If you want to affinate results with travel time by car, you must get a MapBox access token, create a .env file and put inside:

    MAPBOX_ACCESS_TOKEN=your_token

## Usage

    node index.js

+ Enter a numeric ZIP code, like 75000
+ Enter a radius in km. Not too much, since the output of console.log is left to its default, 100