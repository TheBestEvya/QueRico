module.exports = {
  apps : [{
    name   : "QueRicoServer",
    script : "dist/src/app.js",
    env_production : {
      NODE_ENV : "production"
    }
  }]
}
