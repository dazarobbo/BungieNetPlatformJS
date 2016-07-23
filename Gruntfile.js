/* globals module */
module.exports = (grunt) => {
  "use strict";

  grunt.initConfig({

    pkg: grunt.file.readJSON("package.JSON"),

    bower_concat: {
      all:{
        dest: {
          js: "build/<%= pkg.name %>.bower.js"
        },
        include: [
          "urijs",
          "bignumber.js"
        ],
        mainFiles: {
          "urijs": [
            "src/URI.min.js",
            "src/URITemplate.js"
          ]
        }
      }
    },

    //JS classes are NOT hoisted!
    //concatenation MUST be in order!
    concat: {
      options: {
        stripBanners: true,
      },
      dist: {
        src: [
          // "build/bower.js", //always first
          "src/ExtendableError.js",
          "src/BungieNet.js",
          "src/BungieNet.Error.js",
          "src/BungieNet.Cookies.js",
          "src/BungieNet.CurrentUser.js",
          "src/BungieNet.Platform.js",
          "src/BungieNet.Platform.Request.js",
          "src/BungieNet.Platform.Response.js"
        ],
        dest: "build/<%= pkg.name %>.concat.js"
      }
    },

    browserify: {
      dist: {
        options: {
          transform: [
            ["babelify", { presets: ["es2015"], compact: false }]
          ],
          browserifyOptions: {
            standalone: "BungieNetJs"
          }
        },
        files: {
          "build/<%= pkg.name %>.browserify.js":
            "build/<%= pkg.name %>.concat.js"
        }
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
            "build/<%= pkg.name %>.concat.js"
        }
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %>-<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: "build/<%= pkg.name %>.browserify.js",
        dest: "build/<%= pkg.name %>.min.js"
      }
    }

  });

  //grunt.loadNpmTasks("grunt-bower-concat");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-browserify");
  //grunt.loadNpmTasks("grunt-babel");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("default", [
    //"bower_concat",
    "concat",
    "browserify",
    //"babel",
    "uglify"
  ]);

};
