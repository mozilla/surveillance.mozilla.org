/*
  Based on Nathan Searles Day One Gulp Starter Kit - https://github.com/nathansearles/Day-One-Gulp-Starter-Kit
*/

/* ====================================
 * Define paths
 * ==================================== */
var source = '_source';
var build = 'build';


/* ====================================
 * Load required plug-ins
 * ==================================== */
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var runSequence = require('run-sequence');
var del = require('del');
var es = require('event-stream');
var bowerFiles = require('main-bower-files');

var plumberConfig = {errorHandler: $.notify.onError("Error: <%= error.message %>")};


/* ====================================
 * Web server
 * ==================================== */
gulp.task('serve', ['watch'], function(){
  browserSync({
    server: {
      baseDir: build
    },
    notify: false,
    ghostMode: false
  });
});


/* ====================================
 * Styles
 * ==================================== */
gulp.task('styles', function () {
  return gulp.src(source + '/scss/**/components.scss')
    .pipe($.plumber(plumberConfig))
    .pipe($.sass())
    .pipe($.autoprefixer((["last 2  version", "> 1%", "ie 8", "ie 7"], { cascade: true })))
    .pipe(gulp.dest(build + '/css/'));
});


/* ====================================
 * Scripts
 * ==================================== */
gulp.task('jshint', function() {
  return gulp.src(source + '/js/scripts.js')
    .pipe($.plumber(plumberConfig))
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('scripts', function () {
  return gulp.src([source + '/js/plugins.js', source + '/js/**/*'])
    .pipe($.plumber(plumberConfig))
    .pipe(gulp.dest(build + '/js'));
});


/* ====================================
 * Images
 * ==================================== */
gulp.task('images', function() {
  return gulp.src([ source + '/img/**/*'])
    .pipe($.plumber(plumberConfig))
    .pipe($.cache($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true,
      svgoPlugins: [
        { removeViewBox: false },
        { removeUselessStrokeAndFill: false }
      ],
    })))
    .pipe(gulp.dest(build + '/img'));
});


/* ====================================
 * HTML
 * ==================================== */
gulp.task('html-default', function() {

  var vendorjs = gulp.src(bowerFiles())
    .pipe($.plumber(plumberConfig))
    .pipe($.filter('**/*.js'))
    .pipe(gulp.dest(build + '/js/vendor'));

  var modernizrjs = gulp.src(source + '/js/vendor/modernizr.js')
    .pipe($.plumber(plumberConfig))
    .pipe(gulp.dest(build + '/js/vendor'));

  var scripts = gulp.src([source + '/js/plugins.js', source + '/js/scripts.js'])
    .pipe($.plumber(plumberConfig))
    .pipe(gulp.dest(build + '/js'));

  var styles = gulp.src(source + '/scss/**/components.scss')
    .pipe($.plumber(plumberConfig))
    .pipe($.sass())
    .pipe($.autoprefixer((["last 2 version", "> 1%", "ie 8", "ie 7"], { cascade: true })))
    .pipe(gulp.dest(build + '/css/'));

  return gulp.src([
      source + '/htdocs/**/*.html',
      '!' + source + '/htdocs/_templates{,/**}'
    ])
    .pipe($.plumber(plumberConfig))
    .pipe($.fileInclude({
      prefix: '@@',
      basepath: '_source/'
    }))
    .pipe($.inject(modernizrjs,
      { ignorePath: [build, source],
        addRootSlash: true,
        starttag: '<!-- inject:modernizr -->'
      }
    ))
    .pipe($.inject(es.merge(
        vendorjs
      ),
      {
        name: 'bower',
        ignorePath: [build, source],
        addRootSlash: true
      }
    ))
    .pipe($.inject(es.merge(
      styles,
      scripts
    ),
      {
        ignorePath: [build, source],
        addRootSlash: true
      }
    ))
    .pipe(gulp.dest(build));
});

gulp.task('html-build', function() {

  var modernizrjs = gulp.src(source + '/js/vendor/modernizr.js')
    .pipe($.plumber(plumberConfig))
    .pipe($.uglify())
    .pipe($.rename({suffix: '.min'}))
    .pipe(gulp.dest(build + '/js/vendor'));

  var vendorjs = gulp.src(bowerFiles())
    .pipe($.plumber(plumberConfig))
    .pipe($.filter('**/*.js'))
    .pipe($.concat('bower-scripts.js'))
    .pipe($.uglify())
    .pipe($.rename({suffix: '.min'}))
    .pipe(gulp.dest(build + '/js/vendor'));

  var scripts = gulp.src([source + '/js/plugins.js', source + '/js/scripts.js'])
    .pipe($.plumber(plumberConfig))
    .pipe($.concat('scripts.js'))
    .pipe($.uglify())
    .pipe(gulp.dest(build + '/js'));

  var styles = gulp.src(source + '/scss/**/*.scss')
    .pipe($.plumber(plumberConfig))
    .pipe($.sass())
    .pipe($.concat('styles.css'))
    .pipe($.autoprefixer((["last 2 version", "> 1%", "ie 8", "ie 7"], { cascade: true })))
    .pipe($.cssnano())
    .pipe($.rename({suffix: '.min'}))
    .pipe(gulp.dest(build + '/css/'));

  return gulp.src([
      source + '/htdocs/**/*.html',
      '!' + source + '/htdocs/_templates{,/**}'
    ])
    .pipe($.plumber(plumberConfig))
    .pipe($.fileInclude({
      prefix: '@@',
      basepath: '_source/'
    }))
    .pipe($.inject(modernizrjs,
      { ignorePath: [build, source],
        addRootSlash: true,
        starttag: '<!-- inject:modernizr -->'
      }
    ))
    .pipe($.inject(es.merge(
        vendorjs
      ),
      {
        name: 'bower',
        ignorePath: [build, source],
        addRootSlash: true
      }
    ))
    .pipe($.inject(es.merge(
      styles,
      scripts
    ),
      {
        ignorePath: [build, source],
        addRootSlash: true
      }
    ))
    .pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(build));
  });


/* ====================================
 * Clear the image cache
 * ==================================== */
gulp.task('clear', function (done) {
  return $.cache.clearAll(done);
});


/* ====================================
 * Clean up
 * ==================================== */
gulp.task('clean', del.bind(null, [build + '/*'], {dot: true}));


/* ====================================
 * Copy files
 * ==================================== */
gulp.task('copyfiles', function() {
  return gulp.src([source + '/**/*.{ttf,woff,woff2,eot,svg,ico,xml,txt}', source + '/.htaccess'])
    .pipe($.plumber(plumberConfig))
    .pipe(gulp.dest(build));
});


/* ====================================
 * Gulp tasks
 * ==================================== */

// For local development
gulp.task('default', ['clean'], function(){
  runSequence(
    ['html-default', 'images', 'copyfiles'],
    ['serve']
  );
});

// For staging/production deployment
gulp.task('build', ['clean'], function(){
  runSequence(
    ['html-build', 'images', 'copyfiles']
  );
});


/* ====================================
 * Watch
 * ==================================== */
gulp.task('watch', function() {
  gulp.watch(source + '/scss/**/*.scss', ['styles', reload]);

  gulp.watch(source + '/js/**/*.js', ['jshint', 'scripts', reload]);

  gulp.watch(source + '/img/**/*', ['images', reload]);

  gulp.watch(source + '/htdocs/**/*', ['html-default', reload]);
});