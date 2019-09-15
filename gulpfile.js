var gulp            = require('gulp'),
    gutil           = require('gulp-util'),
    sass            = require('gulp-sass'),
    browserSync     = require('browser-sync'),
    autoprefixer    = require('gulp-autoprefixer'),
    uglify          = require('gulp-uglify'),
    header          = require('gulp-header'),
    rename          = require('gulp-rename'),
    cssnano         = require('gulp-cssnano'),
    sourcemaps      = require('gulp-sourcemaps'),
    package         = require('./package.json'),
    browserify      = require('browserify'),
    babelify        = require('babelify'),
    source          = require('vinyl-source-stream'),
    buffer          = require('vinyl-buffer'),
    htmlValidator   = require('gulp-w3c-html-validator'),
    access          = require('gulp-accessibility'),
    imagemin        = require('gulp-imagemin');

/**
 * Banner to put at the top of the generated JS file
 */
var banner = [
  '/*!\n' +
  ' * <%= package.name %>\n' +
  ' * <%= package.title %>\n' +
  ' * <%= package.url %>\n' +
  ' * @author <%= package.author %>\n' +
  ' * @version <%= package.version %>\n' +
  ' * Copyright ' + new Date().getFullYear() + '. <%= package.license %> licensed.\n' +
  ' */',
  '\n'
].join('');

/**
 * SASS to CSS
 */
gulp.task('css', function () {
    return gulp.src('src/scss/style.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer('last 4 version'))
    .pipe(gulp.dest('dist/css'))
    .pipe(cssnano())
    .pipe(rename({ suffix: '.min' }))
    .pipe(header(banner, { package : package }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.reload({stream:true}));
});

/**
 * ES6 down to ES5, minify
 */
gulp.task('js',function(){
    return browserify({
        entries: 'src/js/main.js',
        debug: true
    })
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(header(banner, { package : package }))
    .pipe(gulp.dest('dist/js'))
    .pipe(uglify())
    .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
    .pipe(header(banner, { package : package }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js'))
    .pipe(browserSync.reload({stream:true, once: true}));
});

/**
 * Compress and move images
 */
gulp.task('build-images', function () {
    return gulp.src([
            'src/images/*',
        ])
        .pipe(imagemin([
            imagemin.jpegtran({ progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest('dist/images'));
});

/**
 * Serve files locally
 */
gulp.task('browser-sync', function() {
    browserSync.init(null, {
        server: {
            baseDir: 'dist'
        }
    });
});

/**
 * Reload browser on change
 */
gulp.task('bs-reload', function () {
    browserSync.reload();
});

/**
 * Validate HTML
 */
gulp.task('validate-html', function () {
    return gulp.src('dist/**/*.html')
            .pipe(htmlValidator())
            .pipe(htmlValidator.reporter());
});

/**
 * Check A11Y
 */
gulp.task('ally', function() {
    return gulp.src('dist/**/*.html')
        .pipe(access({
            force: true
        }))
        .on('error', console.log);
});

/**
 * Default task
 */
gulp.task('default', ['js', 'css', 'browser-sync'], function () {
    gulp.watch('src/scss/**/*.scss', ['css']);
    gulp.watch('src/js/**/*.js', ['js']);
    gulp.watch('dist/*.html', ['bs-reload']);
});