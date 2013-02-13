#!/usr/bin/env node

/*
 * This script needs:
 *  csv module: npm install csv
 *  input club file : clubs.in.csv
 * 
 * usage:
 *  ./launch.js > clubs.json
 * 
 * This script will :
 *  - create clubs.out.csv (for mongodb)
 *  - output a json for then client
 */

var csv = require('csv')
  , fs = require('fs');

require("../../server/helpers.js");

csv()
.from.stream(fs.createReadStream(__dirname+'/clubs.in.csv'))
.to.path(__dirname+'/clubs.out.csv')
.transform(function(row, index){
  /*
   * row:
   * 0  fedid
   * 1  name
   * 2  ligue
   * 3  zip
   * 4  city
   * 5  outdoor
   * 6  indoor
   * 7  countPlayers
   * 8  countPlayers1AN
   * 9  countTeams
   * 10 countTeams1AN
   * 11 school
   */
  if (index === 0) {
    row.push("_searchableName");
  } else {
    row.push(row[1].searchable()); // _searchableName
    // row.push(row[4].searchable()); // _searchableCity
  }
  return row;
})
.on('record', function(row,index){
  // post transform ! Amaizing
  if (index == 0)
    return;
  if (index == 1)
    process.stdout.write('[');
  process.stdout.write(JSON.stringify(row));
})
.on('end', function(count){
  process.stdout.write(']');
})
.on('error', function(error){
  console.log(error.message);
});
