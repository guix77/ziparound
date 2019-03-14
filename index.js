const prompt = require('prompt')
const haversine = require('haversine')
const util = require('util')

const places = require('./laposte.json')
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
prompt.message = ''
prompt.start()
prompt.get(schema, function (err, input) {
  const origin = places.find(x => x.fields.code_postal === input.zip.toString())
  if (origin) {
    const start = {
      latitude: origin.fields.coordonnees_gps[0],
      longitude: origin.fields.coordonnees_gps[1]
    }
    const codes = places.reduce((result, place) => {
      if (place.fields.coordonnees_gps) {
        const end = {
          latitude: place.fields.coordonnees_gps[0],
          longitude: place.fields.coordonnees_gps[1]
        }
        const d = haversine(start, end)
        if (d < input.distance) {
          result.push(place.fields.code_postal)
        }
      }
      return result
    }, [])
    const uniqueCodes = [...new Set(codes)]
    console.log('ZIPs found:\n')
    console.log(util.inspect(uniqueCodes, { maxArrayLength: null }))
    console.log(uniqueCodes.length + ' results')
  }
  else {
    console.error('ZIP of search origin not in database, sorry.')
  }
})
