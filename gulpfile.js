'use strict';
/* eslint no-unused-vars: 0 */
const gulp = require('gulp'),
    clean = require('gulp-clean'),
    sass = require('gulp-sass'),
    sassdoc = require('sassdoc'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin'),
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create(),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    merge = require('gulp-merge'),
    log = require('fancy-log'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    spritesmith = require('gulp.spritesmith');

var reportError = function (error) {
    notify({
        title: 'Gulp Task Error',
        message: 'Check the console.'
    }).write(error);

    console.log(error.toString());
    this.emit('end');
};

var gulpPath = {
    appDir: 'app/',
    distDir: 'dist/',
    spriteData: {
        get input() {
            return gulpPath.appDir + 'img/sprite/*.png';
        },
        imgName: 'sprite.png',
        cssName: 'base/_sprite.scss',
        imgPath: './img/sprite.png',
        get cssTemplate() {
            return gulpPath.appDir + 'scss-templates/scss.template.handlebars';
        },
        get outputImg() {
            return gulpPath.appDir + 'img/';
        },
        get outputScss() {
            return gulpPath.appDir + 'scss/';
        }
    },
    jQuery: {
        input: 'node_modules/jquery/dist/jquery.min.js',
        get output() {
            return gulpPath.appDir + 'js/lib/';
        }
    },
    jsLib: {
        get input() {
            return gulpPath.appDir + 'js/lib/*.*';
        },
        get output() {
            return gulpPath.distDir + 'js/lib/';
        }
    },
    JS: {
        get input() {
            return gulpPath.appDir + 'js/app.js';
        },
        get output() {
            return gulpPath.distDir + 'js/';
        }
    },
    bootstrap: {
        input: {
            scss: 'node_modules/bootstrap/scss/**/*.*',
            js: 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
        },
        output: {
            get scss() {
                return gulpPath.appDir + 'scss/_bootstrap/';
            },
            get js() {
                return gulpPath.appDir + 'js/lib/';
            }
        }
    },
    images: {
        get input() {
            return gulpPath.appDir + 'img/**/*.*';
        },
        get noSprite() {
            return '!' + gulpPath.appDir + 'img/sprite/';
        },
        get output() {
            return gulpPath.distDir + 'img/';
        }
    },
    html: {
        get input() {
            return gulpPath.appDir + '*.html';
        },
        get output() {
            return gulpPath.distDir;
        }
    },
    css: {
        get input() {
            return gulpPath.appDir + 'scss/app.scss';
        },
        get output() {
            return gulpPath.distDir + 'css/';
        }
    }
};

gulp.task('clean', function () {
    return gulp.src(gulpPath.distDir + '*', {
        read: false
    })
        .pipe(clean());
});


gulp.task('sprite', function () {
    var spriteData = gulp.src(gulpPath.spriteData.input).pipe(spritesmith({
        imgName: gulpPath.spriteData.imgName,
        cssName: gulpPath.spriteData.cssName,
        imgPath: gulpPath.spriteData.imgPath,
        padding: 20,
        // retinaSrcFilter: ['app/img/sprite/*@2x.png'],
        // retinaImgName: 'sprite@2x.png',
        // retinaImgPath: './img/sprite@2x.png',
        cssTemplate: gulpPath.spriteData.cssTemplate,
    }));

    spriteData.img.pipe(gulp.dest(gulpPath.spriteData.outputImg));
    spriteData.css.pipe(gulp.dest(gulpPath.spriteData.outputScss));

});
// Copy Data 

gulp.task('copyjQuery', function () {
    return gulp.src(gulpPath.jQuery.input)
        .pipe(gulp.dest(gulpPath.jQuery.output));
});

gulp.task('copyBS-scss', function () {
    return gulp.src(gulpPath.bootstrap.input.scss)
        .pipe(gulp.dest(gulpPath.bootstrap.output.scss));
});

gulp.task('copyBS-js', function () {
    return gulp.src(gulpPath.bootstrap.input.js)
        .pipe(gulp.dest(gulpPath.bootstrap.output.js));
});

gulp.task('copyLib', function () {
    return gulp.src(gulpPath.jsLib.input)
        .pipe(gulp.dest(gulpPath.jsLib.output))
        .pipe(browserSync.stream());
});

gulp.task('copyHtml', function () {
    return gulp.src(gulpPath.html.input)
        .pipe(gulp.dest(gulpPath.html.output))
        .pipe(browserSync.stream());
});

// Browserify 
var b = browserify(gulpPath.JS.input, {
    cache: {},
    packageCache: {},
    fullPaths: false
});

gulp.task('copyJS', bundle);
b.on('update', bundle);
b.transform(['babelify', {
    presets: ['@babel/preset-env'],
    babel: require('@babel/core')
}]);

function bundle() {
    return b.bundle()
        .pipe(plumber({
            errorHandler: reportError
        }))
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(uglify({
            compress: {
                sequences: false
            }
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(gulpPath.JS.output))
        .pipe(browserSync.stream());
}

// SCSS => CSS 
gulp.task('css', function () {
    return gulp.src(gulpPath.css.input)
        .pipe(sourcemaps.init())
        .pipe(sassdoc())
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(gulpPath.css.output))
        .pipe(browserSync.stream());
});

// Images
gulp.task('images', function () {
    return gulp.src([
        gulpPath.images.input,
        gulpPath.images.noSprite,
        gulpPath.images.noSprite + '**/*'
    ])
        .pipe(imagemin())
        .pipe(gulp.dest(gulpPath.images.output));
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
    runSequence('clean', 'copyjQuery', 'copyBS-scss', 'copyBS-js', 'copyLib', 'copyJS', 'copyHtml', 'sprite', 'images', 'css');
});

gulp.task('watch', ['browserSync', 'css'], function () {
    gulp.watch(gulpPath.images.input, function () {
        runSequence('sprite', 'images');
    });
    gulp.watch('app/scss/**/*.scss', ['css']);
    gulp.watch(gulpPath.jsLib.input, ['copyLib']);
    gulp.watch(gulpPath.JS.input, ['copyJS']);
    gulp.watch(gulpPath.html.input, ['copyHtml']);
});

