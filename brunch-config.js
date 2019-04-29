// See http://brunch.io for documentation.
module.exports = {

    files: {
        javascripts: {
            // order: {
            //     before: [ 'normalize.css' ],
            //     after:  [ 'helpers.css' ],
            joinTo: {
                'assets/js/vendor.js': /^(?!app)/, // Files that are not in `app` dir.
                'assets/js/app.js': /^app/
            },
        },
        stylesheets: {
            joinTo: 'assets/css/app.css'
        },
    },
    paths: {
        public: 'deploy',
        watched: ['app', 'test', 'vendor'],
    },
    plugins: {
        babel: {presets: ['latest']},
        postcss: {processors: [require('autoprefixer')]}
    },

};