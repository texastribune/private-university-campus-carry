var fs = require('fs')

var chalk = require('chalk')
var copytext = require('copytext')

var fetchDocs = require('./fetch')

var config = require('../config').data

if (config.sheets) {
  console.log(chalk.bold('Fetching spreadsheet files...'))

  var prep = config.sheets.map(function (d) {
    d.type = 'sheet'
    d.filetype = 'xlsx'

    return d
  })

  fetchDocs(prep, function (err, data, opts) {
    if (err) { throw err }

    var fileLocation = './data/' + opts.name + '.json'

    var parsed = copytext(data, opts.copytext)
    fs.writeFileSync(fileLocation, JSON.stringify(parsed, null, 2))
  })
}
