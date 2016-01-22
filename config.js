var config = {}

config.deploy = {
  bucket: 'apps.texastribune.org',
  key: 'private-university-campus-carry',
  profile: 'newsapps'
}

config.dataFolder = './data'
config.templateFolder = './app/templates'

config.data = {
  sheets: [
    {
      fileid: '1-Cu1tUJXRo23L5zdb6hGDOBeLpac5WA3oneJtOjkV1M',
      name: 'universities',
      copytext: {
        basetype: 'objectlist',
        overrides: {
          'META': 'keyvalue'
        }
      }
    }
  ]
}

module.exports = config
