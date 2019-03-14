const prompt = require('prompt')
const haversine = require('haversine')
const util = require('util')
const fetch = require('node-fetch')
require('dotenv').config()

const places = require('./laposte.json')
const mapboxApi = 'https://api.mapbox.com/directions/v5/mapbox/driving/'

const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN

const schema = {
  properties: {
    zip: {
      type: "integer",
      description: "ZIP code of search origin",
      message: "Integer, example: 75000",
      required: true
    },
    distance: {
      type: "integer",
      description: "Distance to search around, in km",
      message: "Integer, example: 25",
      required: true
    }
  }
}
if (mapboxToken) {
  schema.properties.duration = {
    type: "integer",
    description: "Travel time in car, in minutes",
    message: "Integer, example: 30",
    required: true
  }
}
prompt.message = ''
prompt.start()
prompt.get(schema, async (err, input) => {
  const origin = places.find(x => x.fields.code_postal === input.zip.toString())
  if (origin) {
    const reduction1 = reduceAsCrowFiles(input, origin)
    let reduction2
    if (mapboxToken) {
      reduction2 = await reduceOnTravelDuration(input, origin, reduction1)
    }
    // Results.
    const results = reduction2 ? reduction2 : reduction1
    // Eliminate duplicates, mostly if only simple reduction was applied.
    const uniqueZips = [...new Set(results)]
    console.log('ZIPs found:')
    console.log(util.inspect(uniqueZips, { maxArrayLength: null }))
    console.log(uniqueZips.length + ' results')
  }
  else {
    console.error('ZIP of search origin not in database, sorry.')
  }
})

function reduceAsCrowFiles(input, origin) {
  const start = {
    latitude: origin.fields.coordonnees_gps[0],
    longitude: origin.fields.coordonnees_gps[1]
  }
  return places.reduce((result, place) => {
    if (place.fields.coordonnees_gps) {
      const end = {
        latitude: place.fields.coordonnees_gps[0],
        longitude: place.fields.coordonnees_gps[1]
      }
      const d = haversine(start, end)
      if (d <= input.distance) {
        result.push({
          zip: place.fields.code_postal,
          latitude: place.fields.coordonnees_gps[0],
          longitude: place.fields.coordonnees_gps[1]
        })
      }
    }
    return result
  }, [])
}

async function reduceOnTravelDuration(input, origin, reduction1) {
  const start = {
    latitude: origin.fields.coordonnees_gps[0],
    longitude: origin.fields.coordonnees_gps[1]
  }
  const placesPromises = reduction1.map(async place => {
    const coordinates = start.longitude + ',' + start.latitude + ';' + place.longitude + ',' + place.latitude
    const response = await fetch(
      mapboxApi + coordinates + '?access_token=' + mapboxToken
    )
    const json = await response.json()
    const routes = json.routes
    if (routes.length > 0) {
      let travelTime = 0
      routes.forEach(route => {
        travelTime += route.duration
      })
      travelTime /= routes.length
      place.travelTime = travelTime
      return place
    }
  })
  const places = await Promise.all(placesPromises)
  let results = []
  for (let i = 0; i < places.length; i++) {
    if (places[i].travelTime <= input.duration * 60) {
      results.push(places[i].zip)
    }
  }
  return results
}