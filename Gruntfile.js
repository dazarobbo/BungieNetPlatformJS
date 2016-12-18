/* globals module */
module.exports = (grunt) => {
  "use strict";

  //DON'T USE THIS FILE FOR NOW

  grunt.initConfig({

    pkg: grunt.file.readJSON("package.JSON"),

    //JS classes are NOT hoisted!
    //concatenation MUST be in order!
    concat: {
      options: {
        stripBanners: true,
      },
      dist: {
        src: [
          // "build/bower.js", //always first
          "src/BungieNet/BungieNet.js"
        ],
        dest: "build/<%= pkg.name %>.concat.js"
      }
    },

    babel: {
      options: {
        sourceMap: false,
        presets: ["es2015"]
      },
      dist: {
        files: {
          "build/<%= pkg.name %>.babel.js":
            "src/BungieNetJs.js"
        }
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %>-<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: "build/<%= pkg.name %>.babel.js",
        dest: "build/<%= pkg.name %>.min.js"
      }
    }

  });

  grunt.loadNpmTasks("grunt-babel");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("default", [
    "babel",
    "uglify"
  ]);

};
