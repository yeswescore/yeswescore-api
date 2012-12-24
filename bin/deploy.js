#!/usr/bin/env node

/*!
 * deploy.js: 
 * 
 * Deployment server script (dev => prod)
 * - checkouting branch or tag
 * - rsync
 * - node restart
 *
 * Each deployment create a tag.
 * 
 * Copyright(c) 2012 ZeScore <zenodus.com>
 * MIT Licensed
 */

try {
  // @see http://visionmedia.github.com/commander.js/
  var program = require('commander');
} catch (e) {
  console.log('error: ' + e);
  console.log('Please install commander: npm install -g commander');
  process.exit(1);
}

var branch = "master";
var directory = "/opt/web/"

program
  .version('0.0.1')
  .option('-b, --branch <branch>', 'git branch (default=' + branch + ')')
  .option('-t, --tag <tag>', 'git tag')
  .parse(process.argv);

branch = program.tag || program.branch || branch;

// FIXME: checkout bonne branche

// FIXME: RSYNC entre env dev et env prod + logs
// rsync -rltgoDv --del --ignore-errors --force /home/syndr0m/Projs/zescore/server /opt/web/zescore/

// FIXME: node stop/start