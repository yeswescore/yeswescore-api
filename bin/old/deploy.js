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
 */

// MODULES
var exec = require('child_process').exec;

try {
  // @see http://visionmedia.github.com/commander.js/
  var program = require('commander');
} catch (e) {
  console.log('error: ' + e);
  console.log('Please install commander: npm install commander');
  process.exit(1);
}

try {
  var Q = require('q');
} catch (e) {
  console.log('error: ' + e);
  console.log('Please install q: npm install q');
  process.exit(1);
}

// CONF
var branch = "master";
var directory = "/opt/web/"

// USAGE
program
  .version('0.0.1')
  .option('-b, --branch <branch>', 'git branch (default=' + branch + ')')
  .option('-t, --tag <tag>', 'git tag')
  .parse(process.argv);

branch = program.tag || program.branch || branch;

// helpers
var run = function (command, silent) {
  silent || console.log(">"+command);
  return Q.nfcall(exec, command).then(function (args) {
    var r = args[0] || null;
    silent || console.log(r);
    return r;
  }, function (e) { silent || console.log('error: '+e); return null; });
};

// FIXME: checkout bonne branche
console.log('Please wait');
run("./deploy-checkout.sh "+branch).then(function (stdout) {
  if (stdout && stdout.indexOf('[CHECKOUT-OK]') !== -1)
    console.log('YESSS');
  else 
    console.log(stdout);
/*  run("./deploy-rsync").then(function (stdout) {
    console.log('everything seems ok');
  }*/
});

    

// FIXME: RSYNC entre env dev et env prod + logs
// rsync -rltgoDv --del --ignore-errors --force /home/syndr0m/Projs/yeswescore/server /opt/web/yeswescore/

// FIXME: node stop/start