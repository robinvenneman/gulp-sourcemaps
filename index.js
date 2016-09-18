'use strict';
var through = require('through2');
var fs = require('graceful-fs');
var path = require('path');
var convert = require('convert-source-map');
var css = require('css');
var sourcemap = require('vinyl-sourcemap');

var PLUGIN_NAME = 'gulp-sourcemap';

/**
 * Initialize source mapping chain
 */
module.exports.init = function init(options) {
  function sourceMapInit(file, encoding, callback) {
    /*jshint validthis:true */
    var stream = this;

    // pass through if file is null or already has a source map
    if (file.isNull() || file.sourceMap) {
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      return callback(new Error(PLUGIN_NAME + '-init: Streaming not supported'));
    }

    options = options || {};

    sourcemap.add(file, options, function(err, data) {
      if (err) {
        console.log('Error adding sourcemap');
        console.log(err);
      } else {
        stream.push(file);
      }
    });

    callback();
  }

  return through.obj(sourceMapInit);
};

/**
 * Write the source map
 *
 * @param options options to change the way the source map is written
 *
 */
module.exports.write = function write(destPath, options) {
  if (options === undefined && Object.prototype.toString.call(destPath) === '[object Object]') {
    options = destPath;
    destPath = undefined;
  }
  options = options || {};

  // set defaults for options if unset
  if (options.includeContent === undefined)
    options.includeContent = true;
  if (options.addComment === undefined)
    options.addComment = true;
  if (options.charset === undefined)
    options.charset = "utf8";

  function sourceMapWrite(file, encoding, callback) {
    /*jshint validthis:true */
    var stream = this;

    if (file.isNull() || !file.sourceMap) {
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      return callback(new Error(PLUGIN_NAME + '-write: Streaming not supported'));
    }

    sourcemap.write(file, destPath, options, function(err, data) {
      if (err) {
        return;
      }
      data.forEach(function(outFile) {
        stream.push(outFile);
      });
    });
    callback();
  }

  return through.obj(sourceMapWrite);
};
