const gulp = require('gulp'),
    clean = require('gulp-clean'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),
    uncss = require('gulp-uncss'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create(),
    spritesmith = require('gulp.spritesmith');

gulp.task('clean', function(){
    return gulp.src('dist/*', { read : false})
        .pipe(clean());
});

gulp.task('sprite', function(){
    var spriteData = gulp.src('app/img/sprite/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: '_sprite.scss',
        imgPath: './img/sprite.png',
        padding: 20,
        retinaSrcFilter: ['app/img/sprite/*@2x.png'],
        retinaImgName: 'sprite@2x.png',
        retinaImgPath: './img/sprite@2x.png'

    }));

    spriteData.img.pipe(gulp.dest('app/img/'));
    spriteData.css.pipe(gulp.dest('app/scss/'));

});

gulp.task('css', function () {
    return gulp.src('app/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
});

gulp.task('uncss', function () {
    return gulp.src('app/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(uncss({
            html: ['dist/**/*.html']
        }))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
});

gulp.task('copyJQuery', function(){
    return gulp.src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('dist/js/lib/'))
        .pipe(browserSync.stream());
});

gulp.task('copyLib', function(){
    return gulp.src('app/js/lib/*.*')
        .pipe(gulp.dest('dist/js/lib/'))
        .pipe(browserSync.stream());
});

gulp.task('copy', function () {
    return gulp.src('app/**/*.html')
        .pipe(useref())
        .pipe(gulpif('*.js', sourcemaps.init()))
        .pipe(gulpif('*.js', babel({ presets: ['env'] })))
        .pipe(gulpif('*.js', uglify({ compress : { sequences: false }})))
        .pipe(gulpif('*.js', sourcemaps.write('.')))
        .pipe(gulp.dest('dist')) 
        .pipe(browserSync.stream());
});

gulp.task('images', function () {
    return gulp.src([
        'app/img/**/*.*',
        '!app/img/sprite/',
        '!app/img/sprite/**/*'
    ])
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: 'dist'
        }
    });
});


/**
 * Run Tasks 1st run build then watch
 */
gulp.task('build', function(){
    runSequence('clean', 'copy', 'copyLib', 'copyJQuery', 'sprite', 'images', 'uncss');
});

gulp.task('watch', ['browserSync', 'css'], function () {
    gulp.watch('app/img/**/*.*', function() { runSequence('sprite', 'images');});
    gulp.watch('app/scss/**/*.scss', ['css']);
    gulp.watch('app/js/lib/*.*', ['copyLib']);
    gulp.watch('app/**/*.+(html|js)', ['copy']);
});
