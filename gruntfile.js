
module.exports = function(grunt) {
	var _ = grunt.util._;

	grunt.initConfig({
		closurecompiler: {
			minify: {
				files: {
					"js/jinplace.min.js": ["js/jinplace.js"]
				}
			},

			dist: {
				files: {
					'dist/jinplace-<%= grunt.task.current.args %>.min.js':
					['dist/jinplace-<%= grunt.task.current.args %>.js']
				}
			}
		},

		qunit: {
			files: [ "tests/index.html" ]
		},

		clean: {
			tidy: [ "js/jinplace.min.js" ],
			clobber: [ "node_modules" ]
		}

	});

	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-closurecompiler');

	grunt.registerTask('tidy', 'Clean easily rebuilt files', ['clean:tidy']);
	grunt.registerTask('clobber', 'Completely clean to checked out state', ['clean:clobber']);

	// Create a distribution set in the dist directory.  Obviously you
	// have to be updated to the correct tag before running this.
	grunt.registerTask('dist', 'Create a distibution file', function(ver) {
		grunt.file.copy('js/jinplace.js', 'dist/jinplace-' + ver + '.js');
		grunt.task.run('closurecompiler:dist:' + ver);
	});

	grunt.registerTask('minify', 'Minify the javascript file', ['closurecompiler:minify']);
};
