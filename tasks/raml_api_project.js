/*
 * grunt-raml-api-project
 * https://github.com/mmorga/grunt-raml-api-project
 *
 * Copyright (c) 2015 Mark Morga
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    var sf = require('./lib/schema-files.js'),
        rs = require('./lib/raml-schema.js'),
        path = require('path');


    function ramlFileName() {
        return grunt.config('pkg.name') + '-' + grunt.config('pkg.version') + '.raml';
    }

    grunt.registerTask('scan_raml_project', 'Scans project for files to process', function () {
        var options = this.options({
            schemaFiles: 'schema/*.json'
        }),
            done = this.async(), srcFile;

        grunt.config(['raml2html', 'all', 'files', 'public/skumapper.html'], [ramlFileName()]);
        rs.schemaFilesInRamlFile(ramlFileName(), function (sfs) {
            grunt.config('scan_raml_project.schemaFiles', sfs);
            sfs.forEach(function (schemaFile) {
                srcFile = path.dirname(schemaFile) + '/' + path.basename(schemaFile, '-full.json') + '.json';
                grunt.config('json_schema_compose.' + path.basename(schemaFile, '.json') + '.src', srcFile);
                grunt.config('json_schema_compose.' + path.basename(schemaFile, '.json') + '.dest', schemaFile);

                grunt.config(['tv4', path.basename(srcFile), 'options', 'root'],
                    grunt.file.readJSON(srcFile));
                grunt.config(['tv4', path.basename(srcFile), 'options', 'add'],
                    sf.allSchemaFiles);
                grunt.config(['tv4', path.basename(srcFile), 'options', 'schemas'],
                    sf.allSchemaFilesIdMap);
                grunt.config(['tv4', path.basename(srcFile), 'src'],
                    ['examples/' + path.basename(srcFile, '.json') + '*.json']);

                grunt.config(['tv4', path.basename(schemaFile), 'options', 'root'],
                    function () { return grunt.file.readJSON(schemaFile); });
                grunt.config(['tv4', path.basename(schemaFile), 'src'],
                    ['examples/' + path.basename(srcFile, '.json') + '*.json']);
            });
            grunt.log.ok('Found schema files: ' + sfs.join(", "));
            done();
        });
    });

    grunt.registerTask('clean_raml_project', 'Remove generated files', function () {
        grunt.require('scan_raml_project');
        grunt.config('scan_raml_project.schemaFiles').forEach(function (f) {
            grunt.file.delete(f);
            grunt.file.delete('public/' + f);
        });
    });

    grunt.registerTask('copy_raml_to_public', 'Copy composed files to public', function () {
        grunt.config('scan_raml_project.schemaFiles').forEach(function (schemaFile) {
            grunt.file.copy(schemaFile, 'public/schema/' + path.basename(schemaFile));
            grunt.log.ok("Copied " + schemaFile + " to public");
        });
    });
};