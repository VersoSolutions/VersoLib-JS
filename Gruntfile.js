module.exports = function (grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['src/*.js', 'Gruntfile.js', 'test/test.js'],
            options: {
                loopfunc: true
            }
        },
        qunit: {
            all: ['test/index.html']
        },
        concat: {
            options: {
                banner: '/*\n<%= pkg.title %> v<%= pkg.version %>\n<%= pkg.homepage %>\nCopyright (c) 2013 <%= pkg.author.name %>\n<%= pkg.license.url %>\n*/\n\n',
                separator: '\n\n'
            },
            dist: {
                src: [
                    'src/verso.js',
                    'src/card.js',
                    'src/fx.js',
                    'src/order.js'
                ],
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        }
    });

    // Plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Tasks
    grunt.registerTask('default', ['jshint', 'concat', 'qunit']);

};