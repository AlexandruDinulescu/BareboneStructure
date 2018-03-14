const gulp = require('gulp'),
    clean = require('gulp-clean'),
    sass = require('gulp-sass'),
    sassdoc = require('sassdoc'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    tap = require('gulp-tap'),
    /*
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    */
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create(),
    spritesmith = require('gulp.spritesmith'),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify');

var reportError = function (error) {
    notify({
        title: 'Gulp Task Error',
        message: 'Check the console.'
    }).write(error);

    console.log(error.toString());

    this.emit('end');
};

gulp.task('clean', function () {
    return gulp.src('dist/*', {
        read: false
    }).pipe(clean());
});

gulp.task('sprite', function () {
    var spriteData = gulp.src('app/img/sprite/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'base/_sprite.scss',
        imgPath: './img/sprite.png',
        padding: 20,
        // retinaSrcFilter: ['app/img/sprite/*@2x.png'],
        // retinaImgName: 'sprite@2x.png',
        // retinaImgPath: './img/sprite@2x.png',
        cssTemplate: 'app/scss-templates/scss.template.handlebars'

    }));

    spriteData.img.pipe(gulp.dest('app/img/'));
    spriteData.css.pipe(gulp.dest('app/scss/'));

});

gulp.task('css', function () {
    return gulp.src('app/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sassdoc())
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
});

gulp.task('copyJQuery', function () {
    return gulp.src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('dist/js/lib/'))
        .pipe(browserSync.stream());
});

gulp.task('copyJSON', function () {
    return gulp.src('app/JSON/*.*')
        .pipe(gulp.dest('dist/JSON/'))
        .pipe(browserSync.stream());
});

gulp.task('copyLib', function () {
    return gulp.src('app/js/lib/*.*')
        .pipe(gulp.dest('dist/js/lib/'))
        .pipe(browserSync.stream());
});

gulp.task('copyHTML', function () {
    return gulp.src('app/**/*.html')
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
});

let bundlePaths = {
    src: [
        'app/**/*.js'
    ],
    dist: 'dist/js/main.js'
};

// https://github.com/gulpjs/gulp/tree/master/docs/recipes
gulp.task('js', function () {
    return gulp.src(bundlePaths.src, {
        read: false
    })
        .pipe(plumber({
            errorHandler : reportError
        }))
        return browserify({entries: './src/js/app.js', debug: true})
        .transform("babelify", { presets: ["es2015"] })
        .bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./dist/js'))
.pipe(livereload());
});

/**
gulp.task('copy', function () {
    return gulp.src('app/**/
/***.html')
        /**.pipe(useref())
        .pipe(plumber({
            errorHandler: reportError
        }))
        .pipe(gulpif('*.js', sourcemaps.init()))
        .pipe(gulpif('*.js', babel({
            presets: ['env']
        })))
        .pipe(gulpif('*.js', uglify({
            compress: {
                sequences: false
            }
        })))
        .pipe(gulpif('*.js', sourcemaps.write('.')))
        .pipe(plumber.stop())
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
});**/

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
gulp.task('build', function () {
    runSequence('clean', 'copyHTML', 'copyLib', 'copyJQuery', 'copyJSON', 'sprite', 'images', 'css', 'js');
});

gulp.task('watch', ['browserSync', 'css'], function () {
    gulp.watch('app/img/**/*.*', function () {
        runSequence('sprite', 'images');
    });
    gulp.watch('app/scss/**/*.scss', ['css']);
    gulp.watch('app/js/lib/*.*', ['copyLib']);
    gulp.watch('app/JSON/*.*', ['copyJSON']);
    gulp.watch('app/**/*.html', ['copyHTML']);
    gulp.watch('app/js/**/*.js', ['js']);
});
